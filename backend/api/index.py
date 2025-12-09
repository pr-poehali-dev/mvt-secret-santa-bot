import json
import os
import random
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Создание подключения к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def generate_code() -> str:
    """Генерация уникального кода MVT###"""
    return f"MVT{random.randint(100, 999)}"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для управления игрой Тайный Санта
    Обрабатывает запросы для админ-панели и Telegram бота
    """
    method: str = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters', {}) or {}
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        action = params.get('action', '')
        
        if method == 'GET' and action == 'teams':
            cur.execute("""
                SELECT t.id, t.name, t.rules, t.created_at
                FROM teams t
                ORDER BY t.created_at DESC
            """)
            teams = cur.fetchall()
            
            result = []
            for team in teams:
                cur.execute("SELECT code, is_used FROM codes WHERE team_id = %s", (team['id'],))
                codes = cur.fetchall()
                
                cur.execute("SELECT name FROM participants WHERE team_id = %s", (team['id'],))
                participants = [p['name'] for p in cur.fetchall()]
                
                result.append({
                    'id': str(team['id']),
                    'name': team['name'],
                    'rules': team['rules'],
                    'codes': [c['code'] for c in codes],
                    'participants': participants,
                    'createdAt': team['created_at'].isoformat() if team['created_at'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and action == 'createTeam':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name')
            rules = body.get('rules', 'Условия не указаны')
            participant_count = body.get('participantCount', 5)
            
            cur.execute(
                "INSERT INTO teams (name, rules) VALUES (%s, %s) RETURNING id",
                (name, rules)
            )
            team_id = cur.fetchone()['id']
            
            codes = []
            for _ in range(participant_count):
                while True:
                    code = generate_code()
                    cur.execute("SELECT id FROM codes WHERE code = %s", (code,))
                    if not cur.fetchone():
                        break
                
                cur.execute(
                    "INSERT INTO codes (team_id, code) VALUES (%s, %s)",
                    (team_id, code)
                )
                codes.append(code)
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': str(team_id),
                    'name': name,
                    'rules': rules,
                    'codes': codes
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and action == 'participants':
            cur.execute("""
                SELECT p.id, p.name, c.code, p.team_id,
                       p2.name as gift_to_name
                FROM participants p
                JOIN codes c ON p.code_id = c.id
                LEFT JOIN participants p2 ON p.gift_to_id = p2.id
                ORDER BY p.created_at DESC
            """)
            participants = cur.fetchall()
            
            result = [{
                'id': str(p['id']),
                'name': p['name'],
                'code': p['code'],
                'teamId': str(p['team_id']),
                'giftTo': p['gift_to_name']
            } for p in participants]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and action == 'assign':
            body = json.loads(event.get('body', '{}'))
            team_id = body.get('teamId')
            
            cur.execute("SELECT id FROM participants WHERE team_id = %s", (team_id,))
            participant_ids = [p['id'] for p in cur.fetchall()]
            
            if len(participant_ids) < 2:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно участников'}),
                    'isBase64Encoded': False
                }
            
            shuffled = participant_ids[:]
            random.shuffle(shuffled)
            
            for i, pid in enumerate(participant_ids):
                next_idx = (i + 1) % len(shuffled)
                cur.execute(
                    "UPDATE participants SET gift_to_id = %s WHERE id = %s",
                    (shuffled[next_idx], pid)
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and action == 'botRegister':
            body = json.loads(event.get('body', '{}'))
            code = body.get('code')
            name = body.get('name')
            telegram_id = body.get('telegramId')
            
            cur.execute("SELECT id, team_id, is_used FROM codes WHERE code = %s", (code,))
            code_data = cur.fetchone()
            
            if not code_data:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Код не найден'}),
                    'isBase64Encoded': False
                }
            
            if code_data['is_used']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Код уже использован'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO participants (team_id, code_id, name, telegram_id) VALUES (%s, %s, %s, %s) RETURNING id",
                (code_data['team_id'], code_data['id'], name, telegram_id)
            )
            participant_id = cur.fetchone()['id']
            
            cur.execute("UPDATE codes SET is_used = TRUE WHERE id = %s", (code_data['id'],))
            
            cur.execute("SELECT name, rules FROM teams WHERE id = %s", (code_data['team_id'],))
            team_info = cur.fetchone()
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'participantId': str(participant_id),
                    'teamName': team_info['name'],
                    'teamRules': team_info['rules']
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and action == 'botInfo':
            telegram_id = params.get('telegramId')
            
            if not telegram_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'telegramId обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT p.name, t.name as team_name, t.rules,
                       p2.name as gift_to_name
                FROM participants p
                JOIN teams t ON p.team_id = t.id
                LEFT JOIN participants p2 ON p.gift_to_id = p2.id
                WHERE p.telegram_id = %s
            """, (int(telegram_id),))
            
            user_info = cur.fetchone()
            
            if not user_info:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Участник не найден'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'name': user_info['name'],
                    'teamName': user_info['team_name'],
                    'rules': user_info['rules'],
                    'giftTo': user_info['gift_to_name']
                }),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Action not found'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
