# 🎮 Live Stream Overlay

Sistema profissional de overlay para streaming com integrações para **Twitch**, **YouTube** e **Kick**. Compatível com OBS Studio via Browser Sources.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Funcionalidades

- **Overlay Principal** — Moldura de webcam, nome do streamer, redes sociais, barras superior/inferior
- **Sistema de Alertas** — Novos seguidores, inscrições, doações e raids com animações e sons
- **Widgets** — Contador de viewers, barra de meta, último seguidor, última doação, top doador
- **Chat Unificado** — Mensagens de Twitch, YouTube e Kick em uma interface única com identificação visual por plataforma
- **Painel de Configuração** — Interface web completa para personalizar cores, textos, integrações e layout
- **Sistema de Temas** — 3 templates visuais (Gaming, Neon Cyberpunk, Minimal Clean)
- **Integrações em Tempo Real** — WebSocket para Twitch (tmi.js + EventSub), YouTube Live Chat API, Kick (Pusher WebSocket)

## 📁 Estrutura do Projeto

```
live-stream-overlay/
├── server/
│   ├── index.js                 # Servidor principal (Express + WebSocket)
│   └── platforms/
│       ├── twitch.js            # Integração Twitch (chat IRC + EventSub)
│       ├── youtube.js           # Integração YouTube (Live Chat API)
│       └── kick.js              # Integração Kick (Pusher WebSocket)
├── public/
│   ├── overlay.html             # Overlay principal (OBS Browser Source)
│   ├── alerts.html              # Overlay de alertas
│   ├── chat.html                # Chat unificado
│   ├── widgets.html             # Widgets
│   ├── config.html              # Painel de configuração
│   ├── css/
│   │   ├── common.css           # Estilos compartilhados e animações
│   │   ├── overlay.css          # Estilos do overlay principal
│   │   ├── alerts.css           # Estilos e animações de alertas
│   │   ├── chat.css             # Estilos do chat unificado
│   │   ├── widgets.css          # Estilos dos widgets
│   │   ├── config.css           # Estilos do painel de configuração
│   │   └── themes/
│   │       ├── gaming.css       # Tema Gaming (padrão)
│   │       ├── neon.css         # Tema Neon Cyberpunk
│   │       └── minimal.css      # Tema Minimal Clean
│   └── js/
│       ├── ws-client.js         # Cliente WebSocket compartilhado
│       ├── overlay.js           # Lógica do overlay principal
│       ├── alerts.js            # Sistema de alertas com fila
│       ├── chat.js              # Lógica do chat unificado
│       ├── widgets.js           # Lógica dos widgets
│       └── config.js            # Lógica do painel de configuração
├── config.default.json          # Configuração padrão
├── package.json
└── README.md
```

## 🚀 Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ instalado
- [OBS Studio](https://obsproject.com/) para usar os overlays

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/VictorCaixeta/live-stream-overlay.git
cd live-stream-overlay

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm start
```

O servidor iniciará em `http://localhost:3000`. Acesse o painel de configuração em:

```
http://localhost:3000/config.html
```

## 🖥️ Configuração no OBS Studio

### Adicionando Browser Sources

1. Abra o **OBS Studio**
2. Na seção **Fontes**, clique em **+** → **Navegador**
3. Dê um nome (ex: "Overlay Principal")
4. Configure a URL e dimensões conforme a tabela abaixo:

| Componente | URL | Largura | Altura |
|---|---|---|---|
| Overlay Principal | `http://localhost:3000/overlay.html` | 1920 | 1080 |
| Alertas | `http://localhost:3000/alerts.html` | 1920 | 1080 |
| Chat Unificado | `http://localhost:3000/chat.html` | 400 | 600 |
| Widgets | `http://localhost:3000/widgets.html` | 1920 | 1080 |

5. Marque **"Desligar fonte quando não visível"**
6. Clique em **OK**

### Ordem das Camadas (de cima para baixo)

1. Alertas (mais acima)
2. Widgets
3. Chat
4. Overlay Principal
5. Sua webcam / jogo

## 🔗 Conectando com as Plataformas

### Twitch

1. Acesse o painel de configuração → **Plataformas**
2. Ative o **Twitch**
3. Digite o **nome do canal** (ex: `meucanal`)
4. *(Opcional)* Para chat autenticado: obtenha um OAuth token em [twitchapps.com/tmi](https://twitchapps.com/tmi/)
5. *(Opcional)* Para EventSub (follows): registre um app em [dev.twitch.tv](https://dev.twitch.tv/console) e insira o Client ID
6. Clique em **Conectar**

### YouTube

1. Acesse o painel de configuração → **Plataformas**
2. Ative o **YouTube**
3. Obtenha uma **API Key** no [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (ative a YouTube Data API v3)
4. Insira o **Channel ID** ou **Video ID** da live
5. Clique em **Conectar**

### Kick

1. Acesse o painel de configuração → **Plataformas**
2. Ative o **Kick**
3. Digite o **nome do canal** (ex: `meucanal`)
4. Clique em **Conectar**

> **Nota:** A integração com Kick usa WebSocket público (Pusher) e não requer autenticação.

## 🎨 Temas Disponíveis

### Gaming (Padrão)
Cores vibrantes, formas angulares, efeitos de brilho. Perfeito para streams de jogos.

### Neon Cyberpunk
Fundo escuro com acentos neon brilhantes em ciano e magenta. Estilo futurístico.

### Minimal Clean
Design limpo e elegante com bordas suaves e cores neutras. Ideal para streams de conversa ou conteúdo criativo.

Para trocar de tema, acesse o painel de configuração → **Temas** e selecione o desejado. A mudança é aplicada em tempo real em todos os overlays.

## ⚙️ Personalização

### Via Painel de Configuração

- **Geral**: Nome do streamer, título, redes sociais
- **Temas**: Seleção de template visual
- **Cores**: Cores primária, secundária, destaque e texto
- **Overlay**: Layout da webcam, barras, elementos visuais
- **Alertas**: Ativar/desativar por tipo, mensagens personalizadas, duração, volume
- **Widgets**: Ativar/desativar widgets individuais, configurar meta
- **Chat**: Tamanho da fonte, timestamps, badges, fade, filtros por plataforma
- **Plataformas**: Credenciais e conexão com Twitch/YouTube/Kick

### Via CSS (Avançado)

Edite os arquivos em `public/css/themes/` para criar temas personalizados. Use variáveis CSS:

```css
:root {
  --color-primary: #6441a5;
  --color-secondary: #00d4aa;
  --color-accent: #ff6b6b;
  --color-bg: #0e0e10;
  --color-text: #efeff1;
  --color-chat-bg: rgba(14, 14, 16, 0.85);
  --color-alert-bg: rgba(100, 65, 165, 0.9);
}
```

## 💬 Chat Unificado

O chat unificado combina mensagens de Twitch, YouTube e Kick em uma única interface:

- **Identificação visual**: Ícone e cor por plataforma (TW roxo, YT vermelho, KK verde)
- **Ordem cronológica**: Mensagens exibidas em tempo real
- **Filtros**: Botões para filtrar por plataforma
- **Badges**: Moderador, inscrito, VIP e dono do canal
- **Auto-scroll**: Pausa ao passar o mouse, retoma ao sair
- **Fade**: Mensagens desaparecem após tempo configurável
- **Super Chat**: Destaque visual para doações via YouTube

## 🔔 Sistema de Alertas

Tipos de alertas suportados:

| Tipo | Plataformas | Ícone |
|---|---|---|
| Novo Seguidor | Twitch, Kick | ❤️ |
| Inscrição | Twitch, YouTube, Kick | ⭐ |
| Doação | Twitch (Bits), YouTube (Super Chat) | 💰 |
| Raid | Twitch, Kick | ⚔️ |

Cada alerta inclui:
- Animação de entrada/saída
- Efeito de partículas
- Som sintetizado
- Badge da plataforma
- Mensagem personalizável com templates
- Sistema de fila (alertas não se sobrepõem)

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express, WebSocket (ws)
- **Twitch**: tmi.js (chat IRC) + EventSub WebSocket
- **YouTube**: YouTube Data API v3
- **Kick**: Pusher WebSocket
- **Animações**: CSS Animations + Web Audio API

## 📄 Licença

MIT License — veja o arquivo [LICENSE](LICENSE) para detalhes.
