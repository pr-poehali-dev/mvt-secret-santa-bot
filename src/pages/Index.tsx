import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Participant {
  id: string;
  name: string;
  code: string;
  teamId: string;
  giftTo?: string;
}

interface Team {
  id: string;
  name: string;
  rules: string;
  codes: string[];
  participants: string[];
  createdAt: Date;
}

const generateCode = (): string => {
  const randomNum = Math.floor(Math.random() * 900) + 100;
  return `MVT${randomNum}`;
};

const Snowflakes = () => {
  const snowflakes = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 10 + 10}s`,
    animationDelay: `${Math.random() * 10}s`,
    fontSize: `${Math.random() * 10 + 10}px`,
  }));

  return (
    <>
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            fontSize: flake.fontSize,
          }}
        >
          ❄
        </div>
      ))}
    </>
  );
};

const Index = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamRules, setNewTeamRules] = useState('');
  const [participantCount, setParticipantCount] = useState(5);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    const sampleTeam: Team = {
      id: '1',
      name: 'Команда Снежинок',
      rules: 'Бюджет подарка: 1000-1500₽\nДата обмена: 31 декабря\nМесто встречи: уточняется',
      codes: ['MVT123', 'MVT456', 'MVT789'],
      participants: [],
      createdAt: new Date(),
    };
    setTeams([sampleTeam]);
  }, []);

  const createTeam = () => {
    if (!newTeamName.trim()) return;

    const codes = Array.from({ length: participantCount }, () => generateCode());
    
    const newTeam: Team = {
      id: Date.now().toString(),
      name: newTeamName,
      rules: newTeamRules || 'Условия игры не указаны',
      codes,
      participants: [],
      createdAt: new Date(),
    };

    setTeams([...teams, newTeam]);
    setNewTeamName('');
    setNewTeamRules('');
    setParticipantCount(5);
  };

  const assignGifts = (teamId: string) => {
    const teamParticipants = participants.filter(p => p.teamId === teamId);
    if (teamParticipants.length < 2) return;

    const shuffled = [...teamParticipants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const updatedParticipants = participants.map(p => {
      const index = teamParticipants.findIndex(tp => tp.id === p.id);
      if (index !== -1) {
        const nextIndex = (index + 1) % teamParticipants.length;
        return { ...p, giftTo: shuffled[nextIndex].name };
      }
      return p;
    });

    setParticipants(updatedParticipants);
  };

  const addParticipant = (name: string, code: string) => {
    const team = teams.find(t => t.codes.includes(code));
    if (!team) return false;

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name,
      code,
      teamId: team.id,
    };

    setParticipants([...participants, newParticipant]);
    
    const updatedTeams = teams.map(t => 
      t.id === team.id 
        ? { ...t, participants: [...t.participants, name] }
        : t
    );
    setTeams(updatedTeams);
    
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-green-50 to-red-50 relative overflow-hidden">
      <Snowflakes />
      
      <div className="container mx-auto py-8 px-4 relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Icon name="Gift" size={48} className="text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Тайный Санта
            </h1>
            <Icon name="Sparkles" size={48} className="text-accent" />
          </div>
          <p className="text-lg text-muted-foreground">Админ-панель для управления праздничной игрой</p>
        </div>

        <Tabs defaultValue="teams" className="animate-scale-in">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="teams" className="flex gap-2">
              <Icon name="Users" size={18} />
              Команды
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex gap-2">
              <Icon name="UserPlus" size={18} />
              Участники
            </TabsTrigger>
            <TabsTrigger value="codes" className="flex gap-2">
              <Icon name="Key" size={18} />
              Коды
            </TabsTrigger>
            <TabsTrigger value="results" className="flex gap-2">
              <Icon name="Gift" size={18} />
              Результаты
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6 animate-fade-in">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Plus" size={24} />
                  Создать новую команду
                </CardTitle>
                <CardDescription>Задайте название, условия и количество участников</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="teamName">Название команды</Label>
                  <Input
                    id="teamName"
                    placeholder="Например: Команда Оленей"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="teamRules">Условия игры</Label>
                  <Textarea
                    id="teamRules"
                    placeholder="Бюджет подарка, дата обмена, место встречи..."
                    value={newTeamRules}
                    onChange={(e) => setNewTeamRules(e.target.value)}
                    className="mt-2 min-h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="participantCount">Количество участников</Label>
                  <Input
                    id="participantCount"
                    type="number"
                    min={2}
                    max={50}
                    value={participantCount}
                    onChange={(e) => setParticipantCount(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={createTeam} 
                  className="w-full bg-primary hover:bg-primary/90 transition-all hover:scale-105"
                  size="lg"
                >
                  <Icon name="Sparkles" size={20} className="mr-2" />
                  Создать команду и сгенерировать коды
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {teams.map((team) => (
                <Card key={team.id} className="border-2 border-secondary/20 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                  <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon name="Users" size={24} className="text-secondary" />
                        <div>
                          <CardTitle>{team.name}</CardTitle>
                          <CardDescription>
                            {team.participants.length} / {team.codes.length} участников
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-accent border-accent">
                        {team.codes.length} кодов
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                          <Icon name="ScrollText" size={16} />
                          Условия игры:
                        </h4>
                        <p className="text-sm whitespace-pre-line bg-muted/50 p-3 rounded-md">
                          {team.rules}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedTeam(team)}>
                              <Icon name="Key" size={16} className="mr-2" />
                              Показать коды
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Icon name="Key" size={24} />
                                Коды доступа для команды
                              </DialogTitle>
                              <DialogDescription>
                                Раздайте эти коды участникам
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-64 pr-4">
                              <div className="grid gap-2">
                                {selectedTeam?.codes.map((code, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-secondary/5 p-3 rounded-lg border border-primary/20"
                                  >
                                    <span className="font-mono font-bold text-lg">{code}</span>
                                    <Badge variant={team.participants[idx] ? "default" : "secondary"}>
                                      {team.participants[idx] ? "Занят" : "Свободен"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          onClick={() => assignGifts(team.id)}
                          disabled={team.participants.length < 2}
                          className="flex-1 bg-secondary hover:bg-secondary/90"
                        >
                          <Icon name="Shuffle" size={16} className="mr-2" />
                          Распределить подарки
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="participants" className="animate-fade-in">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <Icon name="UserPlus" size={24} />
                  Участники игры
                </CardTitle>
                <CardDescription>Все зарегистрированные участники по командам</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {participants.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Пока нет участников</p>
                    <p className="text-sm mt-2">Участники появятся после регистрации в боте</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teams.map((team) => {
                      const teamParticipants = participants.filter(p => p.teamId === team.id);
                      if (teamParticipants.length === 0) return null;

                      return (
                        <div key={team.id} className="space-y-2">
                          <h3 className="font-semibold flex items-center gap-2 text-secondary">
                            <Icon name="Users" size={20} />
                            {team.name}
                          </h3>
                          <div className="grid gap-2">
                            {teamParticipants.map((participant) => (
                              <div
                                key={participant.id}
                                className="flex items-center justify-between bg-white p-4 rounded-lg border-2 border-primary/10 hover:border-primary/30 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                                    {participant.name[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold">{participant.name}</p>
                                    <p className="text-sm text-muted-foreground font-mono">{participant.code}</p>
                                  </div>
                                </div>
                                {participant.giftTo && (
                                  <Badge className="bg-accent text-accent-foreground">
                                    Дарит → {participant.giftTo}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="codes" className="animate-fade-in">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Key" size={24} />
                  Все коды доступа
                </CardTitle>
                <CardDescription>Управление сгенерированными кодами MVT###</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {teams.map((team) => (
                    <div key={team.id} className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2 text-lg">
                        <Icon name="Users" size={20} className="text-secondary" />
                        {team.name}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {team.codes.map((code, idx) => {
                          const isUsed = team.participants[idx];
                          return (
                            <div
                              key={code}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                isUsed
                                  ? 'bg-secondary/10 border-secondary/30'
                                  : 'bg-primary/5 border-primary/20 hover:border-primary/40'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono font-bold text-lg">{code}</span>
                                {isUsed && <Icon name="Check" size={16} className="text-secondary" />}
                              </div>
                              <Badge variant={isUsed ? "default" : "outline"} className="text-xs">
                                {isUsed ? `Занят: ${isUsed}` : 'Свободен'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="animate-fade-in">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Gift" size={24} />
                  Результаты распределения
                </CardTitle>
                <CardDescription>Кто кому дарит подарки</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {participants.filter(p => p.giftTo).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Icon name="Gift" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Подарки еще не распределены</p>
                    <p className="text-sm mt-2">Нажмите "Распределить подарки" в разделе Команды</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {teams.map((team) => {
                      const teamParticipants = participants.filter(p => p.teamId === team.id && p.giftTo);
                      if (teamParticipants.length === 0) return null;

                      return (
                        <div key={team.id} className="space-y-3">
                          <h3 className="font-semibold flex items-center gap-2 text-lg">
                            <Icon name="Users" size={20} className="text-secondary" />
                            {team.name}
                          </h3>
                          <div className="grid gap-3">
                            {teamParticipants.map((participant) => (
                              <div
                                key={participant.id}
                                className="flex items-center justify-between bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border-2 border-primary/20 hover:shadow-md transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                                    {participant.name[0].toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-lg">{participant.name}</span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <Icon name="ArrowRight" size={24} className="text-accent" />
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-white font-bold text-lg">
                                    {participant.giftTo![0].toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-lg">{participant.giftTo}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 border-2 border-accent/30 bg-gradient-to-r from-accent/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <Icon name="Info" size={24} />
              Как работает игра
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="font-bold text-primary">1.</span>
              <p>Создайте команду и укажите условия игры</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary">2.</span>
              <p>Система автоматически сгенерирует коды формата MVT### для всех участников</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary">3.</span>
              <p>Раздайте коды участникам для регистрации в боте</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary">4.</span>
              <p>После регистрации всех участников нажмите "Распределить подарки"</p>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-primary">5.</span>
              <p>Каждый участник увидит в боте, кому он будет дарить подарок</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
