(() => {
  'use strict';

  const SAVE_KEY = 'mosswood-field-club-v1';
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const SIZE = 32;

  const species = [
    {
      id: 'pipkin', name: 'Pipkin', type: 'GROVE', move: 'Softleaf Flick', power: 5,
      note: 'A shy sprout who warms up after a sunny walk.',
      colors: { K: '#3c5542', G: '#729959', L: '#a7c77c', T: '#e8c680', e: '#354939', W: '#faf2d4' },
      pixels: ['..G....G..', '.KGG..GGK.', '..KGGGGK..', '.KGGGGGGK.', 'KGGGGGGGGK', 'KGeeGGeeGK', 'KGGGTTGGGK', '.KGGGGGGK.', '..KGGGGK..', '...K..K...']
    },
    {
      id: 'mizulet', name: 'Mizulet', type: 'TIDE', move: 'Ripple Tap', power: 5,
      note: 'A patient puddle pal who collects rain in its ears.',
      colors: { K: '#345468', B: '#5596a4', C: '#99c9bb', W: '#eaf4db', e: '#315064', T: '#edcb82' },
      pixels: ['...K..K...', '..KK..KK..', '.KBBBBBBK.', 'KBBBBBBBBK', 'KBBeBBBBeBK', 'KBBBBBBBBBK', '.KBBWWBBK.', '..KBBBBK..', '...KBBK...', '....KK....']
    },
    {
      id: 'cindot', name: 'Cindot', type: 'EMBER', move: 'Candle Pop', power: 6,
      note: 'A tiny ember with a warm nose and a very brave yawn.',
      colors: { K: '#653f43', R: '#c66e58', O: '#e9995d', Y: '#efc67a', e: '#4d3b3d', W: '#fff0cf' },
      pixels: ['...Y..Y...', '..YOYYOY..', '.KRRRRRRK.', 'KRRRRRRRRK', 'KRRReeRRRK', 'KRRRRRRRRK', '.KROWWORK.', '..KRRRRK..', '...KRRK...', '....KK....']
    },
    {
      id: 'pebblit', name: 'Pebblit', type: 'STONE', move: 'Pocket Pebble', power: 6,
      note: 'A thoughtful little rock who knows every shortcut.',
      colors: { K: '#53574d', S: '#8c9480', P: '#c5c6a7', T: '#acb08f', e: '#343a36', W: '#f1eccf' },
      pixels: ['....KK....', '..KKPPKK..', '.KPPPPPPK.', 'KPPPPPPPPSK', 'KPPePPePPK', 'KPPPSSPPPK', '.KPPPPPPK.', '..KPTTPK..', '..KSSSSK..', '...KKKK...']
    },
    {
      id: 'zappip', name: 'Zappip', type: 'SPARK', move: 'Static Skip', power: 5,
      note: 'A bright-eyed spark who can smell a storm coming.',
      colors: { K: '#65543a', Y: '#d0ae54', T: '#f0d77c', R: '#c97865', e: '#4c473b', W: '#fff5d5' },
      pixels: ['..K....K..', '.KYY..YYK.', '..KYYYYK..', '.KYYYYYYK.', 'KYYYYYYYYK', 'KYeeYYeeYK', 'KYYYYYYYYK', '.KYYRRYYK.', '..KYYYYK..', '...K..K...']
    },
    {
      id: 'bloomoth', name: 'Bloomoth', type: 'GROVE', move: 'Pollen Puff', power: 5,
      note: 'A drifting petal-friend who likes to nap in clover.',
      colors: { K: '#5b4c65', V: '#87779f', P: '#c1a7c3', L: '#e3c2a3', e: '#4b3d54', W: '#fff0d8' },
      pixels: ['.VV....VV.', 'VPKV..VKPV', 'VVPKKKKPVV', '..KPPPPK..', '.KPPPPPPK.', 'KPPePPePPK', '.KPPWWPPK.', '..KPPPPK..', '...K..K...', '..........']
    }
  ];

  const byId = new Map(species.map((creature) => [creature.id, creature]));
  const strengths = { GROVE: 'TIDE', TIDE: 'EMBER', EMBER: 'GROVE', SPARK: 'TIDE', STONE: 'SPARK' };
  const directionDelta = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const flowers = new Set(['2,3', '8,3', '6,9', '13,8', '21,10', '22,13', '9,14', '2,14', '13,3']);
  const rocks = new Set(['20,8', '8,10', '21,5']);

  function baseSave() {
    return {
      x: 11, y: 12, facing: 'down', active: 0, balls: 5,
      party: [makeCreature('pipkin', 3)], caught: ['pipkin'],
      journal: 'Pipkin joined your walk. The forest already feels a little smaller.'
    };
  }

  function maxHealth(level) { return 13 + level * 4; }

  function makeCreature(id, level = 2) {
    const maxHp = maxHealth(level);
    return { id, level, hp: maxHp, maxHp, xp: 0 };
  }

  function loadSave() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!raw || !Array.isArray(raw.party) || !raw.party.length) return baseSave();
      const party = raw.party.filter((item) => item && byId.has(item.id)).slice(0, species.length).map((item) => {
        const level = Math.max(1, Math.min(20, Math.round(Number(item.level) || 1)));
        const maxHp = maxHealth(level);
        return { id: item.id, level, maxHp, hp: Math.max(0, Math.min(maxHp, Number(item.hp) || 0)), xp: Math.max(0, Number(item.xp) || 0) };
      });
      if (!party.length) return baseSave();
      const caught = Array.isArray(raw.caught) ? [...new Set(raw.caught.filter((id) => byId.has(id)))].slice(0, species.length) : [];
      party.forEach((item) => { if (!caught.includes(item.id)) caught.push(item.id); });
      return {
        x: Math.max(1, Math.min(22, Math.round(Number(raw.x) || 11))),
        y: Math.max(1, Math.min(14, Math.round(Number(raw.y) || 12))),
        facing: directionDelta[raw.facing] ? raw.facing : 'down',
        active: Math.max(0, Math.min(party.length - 1, Math.round(Number(raw.active) || 0))),
        balls: Math.max(0, Math.min(99, Math.round(Number(raw.balls) || 0))),
        party,
        caught,
        journal: typeof raw.journal === 'string' ? raw.journal.slice(0, 180) : baseSave().journal
      };
    } catch {
      return baseSave();
    }
  }

  const state = loadSave();
  let battle = null;
  let busy = false;
  let toastTimer = 0;
  let animationFrame = 0;

  const active = () => state.party[state.active] || state.party[0];
  const dataFor = (creatureOrId) => byId.get(typeof creatureOrId === 'string' ? creatureOrId : creatureOrId.id) || species[0];

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // The walk can continue in private browsing even if the browser blocks saves.
    }
  }

  function announce(text, { toast = false, caption } = {}) {
    state.journal = text;
    const journal = document.getElementById('journalText');
    journal.textContent = text;
    if (caption) document.getElementById('sceneCaption').textContent = caption;
    if (toast) showToast(text);
    save();
  }

  function showToast(message) {
    const node = document.getElementById('toast');
    node.textContent = message;
    node.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('is-visible'), 2400);
  }

  function tileAt(x, y) {
    if (x <= 0 || x >= 23 || y <= 0 || y >= 15) return 'tree';
    if (x === 3 && y === 11) return 'hut';
    if (rocks.has(`${x},${y}`)) return 'rock';
    if ((x >= 16 && x <= 19 && y >= 4 && y <= 7) || ((x === 15 || x === 20) && y >= 5 && y <= 6)) return 'water';
    if ((y === 12 && x >= 1 && x <= 22) || (x === 11 && y >= 2 && y <= 12)) return 'path';
    if ((x >= 3 && x <= 8 && y >= 4 && y <= 8) || (x >= 14 && x <= 20 && y >= 9 && y <= 14)) return 'tall';
    if (flowers.has(`${x},${y}`)) return 'flower';
    return 'field';
  }

  function blocks(x, y) {
    return ['tree', 'rock', 'water', 'hut'].includes(tileAt(x, y));
  }

  const hash = (x, y, seed = 0) => (Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453) % 1;
  const unitRand = (x, y, seed = 0) => { const n = hash(x, y, seed); return n - Math.floor(n); };

  function fillRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawGrassTile(x, y, time) {
    const px = x * SIZE; const py = y * SIZE;
    fillRect(px, py, SIZE, SIZE, (x + y) % 3 === 0 ? '#82ad6b' : '#8ab570');
    for (let i = 0; i < 5; i += 1) {
      const ox = 3 + unitRand(x, y, i) * 26;
      const oy = 3 + unitRand(y, x, i + 8) * 26;
      fillRect(px + ox, py + oy, 2 + unitRand(x, y, i + 21) * 2, 2, i % 2 ? '#99bf79' : '#78a363');
    }
    if (unitRand(x, y, 4) > .72) fillRect(px + 13, py + 7, 2, 2, '#b5c77e');
    if (tileAt(x, y) === 'tall') {
      fillRect(px, py, SIZE, SIZE, 'rgba(55, 111, 67, .27)');
      const sway = Math.sin(time / 440 + x * .9 + y * .6) * 1.5;
      for (let blade = 0; blade < 5; blade += 1) {
        const bx = px + 4 + blade * 6;
        const by = py + 9 + unitRand(x, y, blade + 31) * 10;
        fillRect(bx + sway, by, 2, 15, blade % 2 ? '#568e56' : '#659b5b');
        fillRect(bx + sway - 3, by + 3, 3, 2, '#79a966');
        fillRect(bx + sway + 2, by + 6, 3, 2, '#9abf70');
      }
      fillRect(px + 7, py + 23, 19, 5, 'rgba(60, 96, 55, .12)');
    }
    if (tileAt(x, y) === 'flower') {
      const fx = px + 8 + Math.floor(unitRand(x, y, 41) * 16);
      const fy = py + 8 + Math.floor(unitRand(y, x, 42) * 12);
      fillRect(fx, fy, 4, 4, '#f3d899');
      fillRect(fx - 2, fy + 1, 2, 2, '#f5ecce');
      fillRect(fx + 4, fy + 1, 2, 2, '#f5ecce');
      fillRect(fx + 1, fy - 2, 2, 2, '#f5ecce');
    }
  }

  function drawPathTile(x, y, time) {
    const px = x * SIZE; const py = y * SIZE;
    fillRect(px, py, SIZE, SIZE, '#c9ae82');
    fillRect(px + 1, py + 1, SIZE - 2, SIZE - 2, '#d3b991');
    for (let i = 0; i < 5; i += 1) {
      const dx = 3 + unitRand(x, y, i + 14) * 25;
      const dy = 3 + unitRand(y, x, i + 19) * 25;
      fillRect(px + dx, py + dy, 2 + unitRand(x, y, i + 5) * 3, 2, i % 2 ? '#c4a77c' : '#ddc69f');
    }
    if ((x === 11 && y >= 3 && y <= 11) && (x + y) % 4 === 1) fillRect(px + 4, py + 27 + Math.sin(time / 550) * 1, 2, 2, '#a5bd79');
  }

  function drawTree(x, y) {
    const px = x * SIZE; const py = y * SIZE;
    fillRect(px, py, SIZE, SIZE, '#638d62');
    fillRect(px + 9, py + 21, 14, 11, '#8c704f');
    fillRect(px + 11, py + 20, 10, 9, '#a18056');
    fillRect(px + 2, py + 8, 28, 17, '#456f50');
    fillRect(px + 6, py + 4, 22, 17, '#4f7b51');
    fillRect(px + 8, py + 1, 16, 14, '#628953');
    fillRect(px + 6, py + 8, 5, 6, '#73955d');
    fillRect(px + 18, py + 4, 5, 5, '#739861');
    fillRect(px + 4, py + 18, 6, 4, '#58804f');
    fillRect(px + 21, py + 16, 7, 4, '#385f48');
    fillRect(px + 1, py + 27, 30, 4, 'rgba(55, 77, 48, .13)');
  }

  function drawWater(x, y, time) {
    const px = x * SIZE; const py = y * SIZE;
    fillRect(px, py, SIZE, SIZE, '#6aabb0');
    fillRect(px + 2, py + 3, 26, 26, '#81bdba');
    fillRect(px + 5, py + 8 + Math.sin(time / 500 + x) * 2, 8, 2, '#c0d7b0');
    fillRect(px + 17, py + 19 + Math.cos(time / 650 + y) * 2, 10, 2, '#a9d1c0');
    fillRect(px + 2, py + 1, 27, 2, '#b4cb93');
    if ((x + y) % 3 === 0) fillRect(px + 23, py + 9, 3, 2, '#dbdcaa');
  }

  function drawRock(x, y) {
    const px = x * SIZE; const py = y * SIZE;
    fillRect(px + 7, py + 16, 19, 11, '#727f6c');
    fillRect(px + 11, py + 10, 13, 11, '#939d83');
    fillRect(px + 15, py + 8, 7, 5, '#acb193');
    fillRect(px + 11, py + 20, 9, 2, '#c0c09c');
  }

  function drawHut(x, y) {
    const px = x * SIZE; const py = y * SIZE;
    fillRect(px + 2, py + 20, 29, 10, 'rgba(61, 79, 50, .18)');
    fillRect(px + 4, py + 12, 25, 18, '#e1c89e');
    fillRect(px + 1, py + 9, 31, 5, '#a86f50');
    fillRect(px + 5, py + 5, 23, 5, '#bb8059');
    fillRect(px + 9, py + 2, 15, 5, '#cf9464');
    fillRect(px + 7, py + 15, 19, 2, '#f1dfba');
    fillRect(px + 14, py + 21, 7, 9, '#795d45');
    fillRect(px + 10, py + 17, 4, 5, '#9ab6a1');
    fillRect(px + 22, py + 17, 4, 5, '#9ab6a1');
    fillRect(px + 20, py + 23, 1, 1, '#e8ce86');
  }

  function drawPixels(creatureOrId, centerX, centerY, size, options = {}) {
    const creature = dataFor(creatureOrId);
    const rows = creature.pixels;
    const width = Math.max(...rows.map((row) => row.length));
    const cell = size / Math.max(width, rows.length);
    const startX = centerX - (width * cell) / 2;
    const startY = centerY - (rows.length * cell) / 2;
    const bob = options.bob || 0;
    ctx.save();
    if (options.flip) {
      ctx.translate(centerX * 2, 0);
      ctx.scale(-1, 1);
    }
    if (options.shadow !== false) {
      fillRect(centerX - size * .35, centerY + size * .36 + bob, size * .7, Math.max(3, size * .1), 'rgba(43, 69, 43, .2)');
    }
    const originX = startX;
    for (let row = 0; row < rows.length; row += 1) {
      const line = rows[row];
      const offset = (width - line.length) * cell / 2;
      for (let col = 0; col < line.length; col += 1) {
        const code = line[col];
        const color = creature.colors[code];
        if (color) fillRect(originX + offset + col * cell, startY + row * cell + bob, cell + .3, cell + .3, color);
      }
    }
    if (options.shine) {
      fillRect(centerX - size * .24, centerY - size * .28 + bob, Math.max(2, cell * .6), Math.max(2, cell * .6), '#fff2ce');
    }
    ctx.restore();
  }

  function drawPlayer(x, y, time, face) {
    const px = x * SIZE; const py = y * SIZE;
    const bob = Math.sin(time / 260) * .8;
    fillRect(px + 8, py + 26, 17, 4, 'rgba(48, 70, 42, .22)');
    fillRect(px + 13, py + 17 + bob, 5, 11, '#5b604e');
    fillRect(px + 20, py + 17 + bob, 5, 11, '#5b604e');
    fillRect(px + 12, py + 27 + bob, 7, 3, '#705746');
    fillRect(px + 19, py + 27 + bob, 7, 3, '#705746');
    fillRect(px + 11, py + 9 + bob, 16, 12, '#e5a875');
    fillRect(px + 9, py + 8 + bob, 20, 12, '#719b70');
    fillRect(px + 10, py + 5 + bob, 18, 6, '#557758');
    fillRect(px + 12, py + 3 + bob, 13, 4, '#5d7e59');
    fillRect(px + 14, py + 12 + bob, 2, 2, '#384940');
    fillRect(px + 22, py + 12 + bob, 2, 2, '#384940');
    if (face === 'left') fillRect(px + 11, py + 12 + bob, 4, 2, '#e5a875');
    if (face === 'right') fillRect(px + 24, py + 12 + bob, 4, 2, '#e5a875');
    fillRect(px + 15, py + 20 + bob, 8, 2, '#e9c782');
  }

  function drawMap(time) {
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 24; x += 1) {
        const tile = tileAt(x, y);
        if (tile === 'tree') drawTree(x, y);
        else if (tile === 'water') drawWater(x, y, time);
        else if (tile === 'path') drawPathTile(x, y, time);
        else {
          drawGrassTile(x, y, time);
          if (tile === 'rock') drawRock(x, y);
          if (tile === 'hut') drawHut(x, y);
        }
      }
    }

    // Small wooden waymarker at the fork in the north trail.
    fillRect(11 * SIZE + 27, 4 * SIZE + 11, 3, 18, '#89694b');
    fillRect(11 * SIZE + 20, 4 * SIZE + 10, 16, 7, '#d8c59b');
    fillRect(11 * SIZE + 23, 4 * SIZE + 12, 10, 2, '#788d62');
    fillRect(11 * SIZE + 23, 4 * SIZE + 15, 7, 1, '#ad916c');

    const buddy = active();
    const bx = state.x * SIZE + 12;
    const by = state.y * SIZE + 18 + Math.sin(time / 300) * 1.2;
    drawPixels(buddy, bx, by, 20, { bob: Math.sin(time / 300) * 1.3, shadow: false });
    drawPlayer(state.x, state.y, time, state.facing);
  }

  function roundRect(x, y, width, height, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
  }

  function drawHpBar(x, y, width, ratio, color = '#7fac71') {
    roundRect(x, y, width, 8, 4, 'rgba(55, 74, 57, .15)');
    roundRect(x, y, Math.max(5, width * ratio), 8, 4, color);
  }

  function drawBattle(time) {
    const enemy = dataFor(battle.enemy.id);
    const friend = dataFor(active());
    const sky = ctx.createLinearGradient(0, 0, 0, 390);
    sky.addColorStop(0, '#b1d1c0');
    sky.addColorStop(.68, '#dbe0b8');
    sky.addColorStop(1, '#e8dcab');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = .62;
    ctx.fillStyle = '#f4d690';
    ctx.beginPath(); ctx.arc(590, 84, 31, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    roundRect(-30, 190, 260, 105, 50, '#9fb891');
    roundRect(176, 164, 247, 137, 60, '#90af88');
    roundRect(404, 195, 250, 98, 44, '#9db58c');
    ctx.fillStyle = '#99b779';
    ctx.beginPath(); ctx.moveTo(0, 309); ctx.quadraticCurveTo(180, 265, 346, 308); ctx.quadraticCurveTo(515, 266, 768, 307); ctx.lineTo(768, 512); ctx.lineTo(0, 512); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8aaf70';
    ctx.beginPath(); ctx.ellipse(375, 391, 430, 126, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#aec084';
    ctx.beginPath(); ctx.ellipse(375, 435, 400, 68, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 24; i += 1) {
      const x = (i * 83 + 21) % 756;
      const y = 318 + ((i * 43) % 175);
      fillRect(x, y, 2, 5, i % 2 ? '#749b68' : '#91ad73');
    }
    ctx.globalAlpha = .14;
    ctx.fillStyle = '#465d49';
    ctx.beginPath(); ctx.ellipse(552, 232, 69, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(207, 420, 100, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    drawPixels(enemy, 555, 185 + Math.sin(time / 290) * 3, 148, { flip: true, bob: Math.sin(time / 290) * 3, shine: true });
    drawPixels(friend, 204, 367 + Math.sin(time / 330 + 1) * 2, 166, { bob: Math.sin(time / 330 + 1) * 2, shine: true });

    const player = active();
    const message = battle.message || `${enemy.name} is watching you curiously.`;
    roundRect(45, 24, 378, 39, 4, 'rgba(249, 249, 238, .83)');
    ctx.fillStyle = '#516e55';
    ctx.font = '500 12px "DM Mono", monospace';
    ctx.fillText(message.slice(0, 52), 61, 48);

    // The warm little wildlife guide card in the top-right.
    roundRect(474, 37, 252, 84, 4, 'rgba(249, 249, 238, .95)');
    ctx.fillStyle = '#889381'; ctx.font = '500 9px "DM Mono", monospace'; ctx.fillText('A WILD NEIGHBOR', 492, 56);
    ctx.fillStyle = '#314b39'; ctx.font = '600 18px "Fraunces", Georgia, serif'; ctx.fillText(enemy.name, 492, 81);
    ctx.fillStyle = '#a67c59'; ctx.font = '500 10px "DM Mono", monospace'; ctx.fillText(`LV ${battle.enemy.level}`, 681, 80);
    drawHpBar(492, 96, 212, battle.enemy.hp / battle.enemy.maxHp, battle.enemy.hp / battle.enemy.maxHp < .3 ? '#d49765' : '#81aa71');

    // A smaller crew card settles into the lower-left, with space for the creature.
    roundRect(43, 418, 278, 70, 4, 'rgba(249, 249, 238, .96)');
    ctx.fillStyle = '#889381'; ctx.font = '500 9px "DM Mono", monospace'; ctx.fillText('YOUR FIELD BUDDY', 59, 437);
    ctx.fillStyle = '#314b39'; ctx.font = '600 17px "Fraunces", Georgia, serif'; ctx.fillText(friend.name, 59, 460);
    ctx.fillStyle = '#a67c59'; ctx.font = '500 9px "DM Mono", monospace'; ctx.fillText(`LV ${player.level}`, 253, 459);
    drawHpBar(59, 470, 247, player.hp / player.maxHp, player.hp / player.maxHp < .3 ? '#d49765' : '#81aa71');
    ctx.fillStyle = '#fff8df'; ctx.font = '500 9px "DM Mono", monospace';
    const hint = 'TAKE A BREATH. PICK A MOVE.';
    const hintWidth = ctx.measureText(hint).width;
    roundRect(canvas.width - hintWidth - 38, 469, hintWidth + 20, 20, 9, 'rgba(54, 83, 60, .75)');
    ctx.fillText(hint, canvas.width - hintWidth - 28, 483);
  }

  function draw(time = 0) {
    ctx.imageSmoothingEnabled = false;
    if (battle) drawBattle(time);
    else drawMap(time);
    animationFrame = requestAnimationFrame(draw);
  }

  function creatureCanvas(item, size = 44) {
    const tiny = document.createElement('canvas');
    tiny.width = size;
    tiny.height = size;
    const tinyCtx = tiny.getContext('2d');
    const creature = dataFor(item);
    const rows = creature.pixels;
    const width = Math.max(...rows.map((row) => row.length));
    const cell = size * .78 / Math.max(width, rows.length);
    const startX = (size - width * cell) / 2;
    const startY = (size - rows.length * cell) / 2;
    for (let row = 0; row < rows.length; row += 1) {
      const line = rows[row];
      const offset = (width - line.length) * cell / 2;
      for (let col = 0; col < line.length; col += 1) {
        const color = creature.colors[line[col]];
        if (color) {
          tinyCtx.fillStyle = color;
          tinyCtx.fillRect(Math.round(startX + offset + col * cell), Math.round(startY + row * cell), Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
    return tiny;
  }

  function renderParty() {
    const list = document.getElementById('partyList');
    list.replaceChildren();
    state.party.forEach((member, index) => {
      const data = dataFor(member);
      const button = document.createElement('button');
      button.className = `party-slot${index === state.active ? ' is-leader' : ''}${member.hp <= 0 ? ' is-fainted' : ''}`;
      button.type = 'button';
      button.disabled = busy || member.hp <= 0 || (battle && index === state.active);
      button.setAttribute('aria-label', `${data.name}, level ${member.level}, ${member.hp} of ${member.maxHp} health${index === state.active ? ', leading the walk' : ''}`);
      button.title = battle ? (index === state.active ? 'Already in the clearing' : 'Switch to this friend (the wild creature gets a turn)') : `Let ${data.name} lead the walk`;

      const portrait = document.createElement('span'); portrait.className = 'party-sprite';
      const miniature = creatureCanvas(member, 42); miniature.setAttribute('aria-hidden', 'true'); portrait.append(miniature);
      const detail = document.createElement('span'); detail.className = 'party-info';
      const nameLine = document.createElement('span'); nameLine.className = 'party-name-line';
      const name = document.createElement('strong'); name.className = 'party-name'; name.textContent = data.name;
      const tag = document.createElement('span'); tag.className = 'type-tag'; tag.textContent = data.type;
      nameLine.append(name, tag);
      const level = document.createElement('span'); level.className = 'party-level'; level.textContent = `LV ${member.level} · ${member.hp}/${member.maxHp} HP`;
      const health = document.createElement('span'); health.className = 'party-health';
      const amount = document.createElement('span'); amount.style.width = `${Math.max(0, member.hp / member.maxHp * 100)}%`; health.append(amount);
      detail.append(nameLine, level, health);
      button.append(portrait, detail);
      if (index === state.active) {
        const leader = document.createElement('span'); leader.className = 'leader-mark'; leader.textContent = '✦'; leader.setAttribute('aria-label', 'Leader'); button.append(leader);
      }
      button.addEventListener('click', () => switchLead(index));
      list.append(button);
    });
    document.getElementById('partyCount').textContent = String(state.party.length).padStart(2, '0');
  }

  function renderNotes() {
    const grid = document.getElementById('speciesGrid');
    grid.replaceChildren();
    species.forEach((creature) => {
      const found = state.caught.includes(creature.id);
      const note = document.createElement('div');
      note.className = `species-note${found ? '' : ' is-unknown'}`;
      note.setAttribute('aria-label', found ? `${creature.name}, ${creature.type}` : 'Undiscovered neighbor');
      const portrait = creatureCanvas(creature.id, 34); portrait.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span'); label.textContent = found ? creature.name : '???';
      note.append(portrait, label);
      grid.append(note);
    });
  }

  function renderHud() {
    const wrapper = document.getElementById('battleHud');
    if (!battle) { wrapper.hidden = true; wrapper.replaceChildren(); return; }
    wrapper.hidden = false;
    const friend = active();
    const wild = battle.enemy;
    const friendData = dataFor(friend);
    const wildData = dataFor(wild);
    wrapper.innerHTML = `
      <div class="battle-hud-card">
        <div class="battle-hud-label"><span>WILD NEIGHBOR</span><span>${wildData.type}</span></div>
        <div class="battle-hud-name"><strong>${wildData.name}</strong><span>LV ${wild.level}</span></div>
        <div class="hp-track"><span class="${wild.hp / wild.maxHp < .3 ? 'low-hp' : ''}" style="width:${Math.max(0, wild.hp / wild.maxHp * 100)}%"></span></div>
        <span class="hp-label">${wild.hp} / ${wild.maxHp} HP</span>
      </div>
      <div class="battle-hud-card player-hud">
        <div class="battle-hud-label"><span>YOUR FIELD BUDDY</span><span>${friendData.type}</span></div>
        <div class="battle-hud-name"><strong>${friendData.name}</strong><span>LV ${friend.level}</span></div>
        <div class="hp-track"><span class="${friend.hp / friend.maxHp < .3 ? 'low-hp' : ''}" style="width:${Math.max(0, friend.hp / friend.maxHp * 100)}%"></span></div>
        <span class="hp-label">${friend.hp} / ${friend.maxHp} HP</span>
      </div>`;
  }

  function render() {
    const capturedCount = state.caught.length;
    document.getElementById('guideCount').textContent = capturedCount;
    document.getElementById('notesBadge').textContent = `${capturedCount} / ${species.length}`;
    document.getElementById('coordinates').textContent = `${String(state.x).padStart(2, '0')}, ${String(state.y).padStart(2, '0')}`;
    document.getElementById('questProgress').style.width = `${capturedCount / species.length * 100}%`;
    document.getElementById('questProgressText').textContent = `${capturedCount} OF ${species.length}`;
    document.getElementById('questComplete').hidden = capturedCount !== species.length;
    document.getElementById('sphereCount').textContent = state.balls;
    document.getElementById('mapControls').hidden = Boolean(battle);
    document.getElementById('battleControls').hidden = !battle;
    document.getElementById('sceneCaption').textContent = battle ? 'The clearing hushes for a moment.' : 'The wind smells like rain and wild mint.';
    const nearHut = Math.abs(state.x - 3) + Math.abs(state.y - 11) <= 1;
    document.getElementById('restButton').disabled = !nearHut;
    document.getElementById('restButton').classList.toggle('is-near', nearHut);
    if (battle) {
      const wild = dataFor(battle.enemy.id);
      const friend = dataFor(active());
      document.getElementById('moveName').textContent = friend.move;
      document.getElementById('moveDetail').textContent = `${friend.type} · ${friend.power} POWER`;
      document.getElementById('battlePromptTitle').textContent = battle.message && battle.message.startsWith('A little') ? 'A little pause.' : `${wild.name} is here.`;
      document.getElementById('battlePromptText').textContent = battle.message || 'Choose a move, offer a sphere, or take the trail home.';
      document.getElementById('attackButton').disabled = busy || active().hp <= 0;
      document.getElementById('catchButton').disabled = busy || state.balls <= 0;
      document.getElementById('runButton').disabled = busy;
    }
    renderParty();
    renderNotes();
    renderHud();
    document.getElementById('tipTitle').textContent = nearHut ? 'The kettle is on.' : 'Look around.';
    document.getElementById('tipText').textContent = nearHut ? 'Press E or tap Rest to warm up and heal the crew.' : 'The tall grass rustles when someone is near.';
  }

  function startBattle(id) {
    const wildLevel = 2 + Math.floor(Math.random() * 4);
    const maxHp = maxHealth(wildLevel);
    const wild = dataFor(id);
    battle = { enemy: { id, level: wildLevel, hp: maxHp, maxHp }, message: `${wild.name} poked its head above the grass.` };
    busy = false;
    render();
    showToast(`${wild.name} found you in the grass.`);
  }

  function move(direction) {
    if (battle || busy || !directionDelta[direction]) return;
    state.facing = direction;
    const [dx, dy] = directionDelta[direction];
    const nextX = state.x + dx;
    const nextY = state.y + dy;
    if (!blocks(nextX, nextY)) {
      state.x = nextX;
      state.y = nextY;
      if (tileAt(state.x, state.y) === 'tall' && Math.random() < .115) {
        const undiscovered = species.filter((creature) => !state.caught.includes(creature.id));
        const encounterPool = undiscovered.length && Math.random() < .72 ? undiscovered : species;
        const id = encounterPool[Math.floor(Math.random() * encounterPool.length)].id;
        save();
        startBattle(id);
        return;
      }
    }
    render();
    save();
  }

  function isBesideHut() {
    return Math.abs(state.x - 3) + Math.abs(state.y - 11) <= 1;
  }

  function restAtHut() {
    if (battle) return;
    if (!isBesideHut()) {
      showToast('Follow the sandy path west to the little hut.');
      return;
    }
    state.party.forEach((friend) => { friend.hp = friend.maxHp; });
    state.balls = Math.max(state.balls, 5);
    state.x = 4;
    state.y = 11;
    announce('The crew warmed up by the kettle. Everyone healed up, and your satchel has five spheres.', { toast: true });
    render();
  }

  function switchLead(index) {
    if (index === state.active || !state.party[index] || state.party[index].hp <= 0 || busy) return;
    state.active = index;
    if (battle) {
      const data = dataFor(active());
      battle.message = `${data.name} stepped into the clearing.`;
      busy = true;
      render();
      setTimeout(() => enemyTurn(), 450);
    } else {
      const data = dataFor(active());
      announce(`${data.name} is happy to lead the next stretch of trail.`, { toast: true });
      render();
    }
  }

  function effectiveness(type, defendingType) {
    return strengths[type] === defendingType ? 1.45 : 1;
  }

  function awardExperience(points) {
    const friend = active();
    const data = dataFor(friend);
    friend.xp += points;
    const threshold = friend.level * 7;
    if (friend.xp >= threshold && friend.level < 20) {
      friend.xp -= threshold;
      friend.level += 1;
      const oldMax = friend.maxHp;
      friend.maxHp = maxHealth(friend.level);
      friend.hp = Math.min(friend.maxHp, friend.hp + (friend.maxHp - oldMax) + 3);
      battle && (battle.message = `${data.name} grew to level ${friend.level}!`);
      return `${data.name} grew to level ${friend.level}!`;
    }
    return `${data.name} earned a little trail experience.`;
  }

  function finishBattle(message, { toast = true, journal = true } = {}) {
    battle = null;
    busy = false;
    if (journal) announce(message, { toast });
    else if (toast) showToast(message);
    render();
  }

  function attack() {
    if (!battle || busy || active().hp <= 0) return;
    busy = true;
    const friend = active();
    const friendData = dataFor(friend);
    const enemyData = dataFor(battle.enemy);
    const bonus = effectiveness(friendData.type, enemyData.type);
    const damage = Math.max(2, Math.round((friendData.power + friend.level * .8 + Math.random() * 3) * bonus));
    battle.enemy.hp = Math.max(0, battle.enemy.hp - damage);
    battle.message = bonus > 1 ? `${friendData.move} found the right rhythm!` : `${friendData.name} tried ${friendData.move}.`;
    render();
    if (battle.enemy.hp <= 0) {
      const result = awardExperience(3 + battle.enemy.level * 2);
      setTimeout(() => finishBattle(`${enemyData.name} trotted home safely. ${result}`, { toast: true }), 450);
      return;
    }
    save();
    setTimeout(() => enemyTurn(), 450);
  }

  function enemyTurn() {
    if (!battle) { busy = false; return; }
    const friend = active();
    if (friend.hp <= 0) {
      const next = state.party.findIndex((member) => member.hp > 0);
      if (next === -1) {
        recoverAfterTumble();
        return;
      }
      state.active = next;
      battle.message = `${dataFor(active()).name} hurried out to help.`;
    } else {
      const wildData = dataFor(battle.enemy);
      const friendData = dataFor(active());
      const bonus = effectiveness(wildData.type, friendData.type);
      const damage = Math.max(2, Math.round((2 + battle.enemy.level * .72 + Math.random() * 2) * bonus));
      friend.hp = Math.max(0, friend.hp - damage);
      battle.message = friend.hp === 0 ? `${friendData.name} needs a little rest.` : `${wildData.name} gave ${friendData.name} a gentle bump.`;
    }
    if (active().hp <= 0) {
      const next = state.party.findIndex((member) => member.hp > 0);
      if (next === -1) {
        render();
        setTimeout(recoverAfterTumble, 450);
        return;
      }
      state.active = next;
      battle.message = `${dataFor(active()).name} is ready to keep going.`;
    }
    busy = false;
    render();
    save();
  }

  function recoverAfterTumble() {
    if (!battle) return;
    battle = null;
    busy = false;
      state.party.forEach((member) => { member.hp = Math.max(1, Math.ceil(member.maxHp * .55)); });
    state.active = 0;
    state.x = 4;
    state.y = 11;
    state.balls = Math.max(state.balls, 5);
    announce('A neighbor walked the tired crew back to the hut. A cup of tea and you are on your feet again.', { toast: true });
    render();
  }

  function offerSphere() {
    if (!battle || busy || state.balls <= 0) return;
    busy = true;
    state.balls -= 1;
    const wild = battle.enemy;
    const data = dataFor(wild);
    const ratio = wild.hp / wild.maxHp;
    const successChance = Math.min(.96, .17 + (1 - ratio) * .73 + (wild.level < active().level ? .08 : 0));
    if (Math.random() < successChance) {
      const newFriend = !state.party.some((member) => member.id === wild.id);
      const wasUnknown = !state.caught.includes(wild.id);
      if (wasUnknown) state.caught.push(wild.id);
      if (newFriend && state.party.length < species.length) {
        state.party.push(makeCreature(wild.id, wild.level));
        announce(`${data.name} joined the crew. The field guide has a new little sketch.`, { toast: false });
      } else if (!newFriend) {
        active().hp = Math.min(active().maxHp, active().hp + 3);
        state.balls = Math.min(99, state.balls + 1);
        state.journal = `${data.name} knows the way back to your crew. Everyone shared a happy little hello.`;
      }
      save();
      battle.message = newFriend ? `${data.name} joined you for the walk!` : `${data.name} recognized a friend and came back to say hello.`;
      render();
      setTimeout(() => finishBattle(newFriend ? `${data.name} is in the field guide now. What a good day for a walk.` : `${data.name} came to say hello. Your satchel sphere came back, too.`, { toast: true }), 600);
      return;
    }
    battle.message = `${data.name} took a peek, then slipped back into the grass.`;
    render();
    save();
    setTimeout(() => enemyTurn(), 500);
  }

  function leaveBattle() {
    if (!battle || busy) return;
    const name = dataFor(battle.enemy).name;
    finishBattle(`${name} waved and slipped back into the grass. Maybe you'll meet again.`, { toast: true });
  }

  function interact() {
    if (battle) return;
    if (isBesideHut()) restAtHut();
    else showToast('The little hut is west along the sandy trail.');
  }

  function resetGame() {
    if (!window.confirm('Start a new walk? This clears your local field guide and its saved crew.')) return;
    Object.assign(state, baseSave());
    state.battle = undefined;
    battle = null;
    busy = false;
    save();
    render();
    showToast('A fresh journal, and a whole woods to explore.');
  }

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    if (battle) {
      if (key === '1') attack();
      if (key === '2') offerSphere();
      if (key === 'escape') leaveBattle();
      if (key === 'e') interact();
      return;
    }
    const direction = ({ arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' })[key];
    if (direction) move(direction);
    if (key === 'e') interact();
  });

  document.querySelectorAll('[data-direction]').forEach((button) => {
    button.addEventListener('click', () => move(button.dataset.direction));
  });
  document.getElementById('restButton').addEventListener('click', interact);
  document.getElementById('attackButton').addEventListener('click', attack);
  document.getElementById('catchButton').addEventListener('click', offerSphere);
  document.getElementById('runButton').addEventListener('click', leaveBattle);
  document.getElementById('resetButton').addEventListener('click', resetGame);
  canvas.addEventListener('click', () => canvas.focus({ preventScroll: true }));

  render();
  draw();
  window.addEventListener('beforeunload', () => cancelAnimationFrame(animationFrame));
})();
