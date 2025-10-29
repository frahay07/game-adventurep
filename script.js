// Adventure Quest — Game 2D
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Resize canvas
  function resize(){
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = 480 * devicePixelRatio;
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  const ui = {
    health: document.getElementById('ui-health'),
    level: document.getElementById('ui-level'),
    enemies: document.getElementById('ui-enemies'),
    score: document.getElementById('ui-score'),
    stage: document.getElementById('ui-stage'),
    mission: document.getElementById('ui-mission')
  };

  let running=false, paused=false, lastTime=0, stageIndex=0, score=0;
  const totalStages=5;

  const world = { gravity:0.9, groundY:380, width:900, height:480 };
  const player = { x:100, y:world.groundY-48, w:32, h:48, vx:0, vy:0, speed:3.2, onGround:false, facing:1, hp:100, maxHp:100, attackCooldown:0 };
  let enemies = [];

  const stages=[];
  for(let i=1;i<=totalStages;i++){
    stages.push({ enemyCount:2+i, enemySpeed:0.6+i*0.2, mission:`Kalahkan semua monster di tahap ${i}` });
  }

  function spawnStage(i){
    const cfg=stages[i];
    enemies=[];
    for(let j=0;j<cfg.enemyCount;j++){
      const ex=300+j*80;
      enemies.push({x:ex,y:world.groundY-40,w:36,h:40,vx:(Math.random()>0.5?1:-1)*cfg.enemySpeed,hp:20+i*5,maxHp:20+i*5});
    }
    ui.mission.textContent=cfg.mission;
    ui.enemies.textContent=enemies.length;
    ui.stage.textContent=(i+1)+' / '+totalStages;
    ui.level.textContent=i+1;
  }

  const keys={};
  window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;});
  window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});

  document.getElementById('btn-start').onclick=()=>{ if(!running){startGame();} paused=false; };
  document.getElementById('btn-pause').onclick=()=>{ paused=!paused; };
  document.getElementById('btn-reset').onclick=()=>{ resetGame(); };

  function startGame(){
    running=true; paused=false; lastTime=performance.now(); stageIndex=0; score=0;
    player.hp=player.maxHp; player.x=100; player.y=world.groundY-48;
    spawnStage(stageIndex); ui.score.textContent=score;
    requestAnimationFrame(loop);
  }

  function resetGame(){
    running=false; paused=false; stageIndex=0; score=0; enemies=[];
    ui.score.textContent=0; ui.enemies.textContent=0;
    ui.level.textContent='-'; ui.mission.textContent='Tekan Start untuk bermain';
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  function loop(now){
    if(!running) return;
    const dt=Math.min((now-lastTime)/16.666,4);
    lastTime=now;
    if(!paused){ update(dt); render(); }
    requestAnimationFrame(loop);
  }

  function update(dt){
    const left=keys['a']||keys['arrowleft'];
    const right=keys['d']||keys['arrowright'];
    const up=keys['w']||keys['arrowup']||keys[' '];
    const attack=keys['j'];

    if(left){ player.vx=-player.speed; player.facing=-1; }
    else if(right){ player.vx=player.speed; player.facing=1; }
    else { player.vx=0; }

    if(up && player.onGround){ player.vy=-13; player.onGround=false; }

    player.vy += world.gravity;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    if(player.y + player.h >= world.groundY){ player.y=world.groundY-player.h; player.vy=0; player.onGround=true; }
    player.x = Math.max(0, Math.min(world.width-player.w, player.x));

    if(attack && player.attackCooldown<=0){ player.attackCooldown=20; performAttack(); }
    if(player.attackCooldown>0) player.attackCooldown -= dt;

    for(let e of enemies){
      e.x += e.vx * dt * 20;
      if(e.x<160) e.vx=Math.abs(e.vx);
      if(e.x>world.width-120) e.vx=-Math.abs(e.vx);
      if(overlap(player,e)){
        player.hp -= 0.12*dt*60;
        if(player.hp<=0){player.hp=0; gameOver(false);}
      }
    }

    enemies=enemies.filter(e=>e.hp>0);
    ui.enemies.textContent=enemies.length;

    if(enemies.length===0){
      stageIndex++;
      if(stageIndex>=totalStages){gameOver(true);}
      else spawnStage(stageIndex);
    }

    ui.health.style.width=(player.hp/player.maxHp*100)+'%';
    ui.score.textContent=score;
  }

  function performAttack(){
    const range={x:player.x+(player.facing>0?player.w:-40), y:player.y+8, w:40, h:32};
    for(let e of enemies){
      if(overlap(range,e)){
        e.hp -= 12 + Math.random()*6;
        score += 10;
        e.x += player.facing * 12;
      }
    }
  }

  function overlap(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  function gameOver(victory){
    running=false; paused=false;
    setTimeout(()=>{
      const msg = victory ? 'SELAMAT! Kamu menang!' : 'KALAH! Coba lagi.';
      alert(msg+'\\nSkor: '+score+'\\nTekan Restart untuk main lagi.');
    },100);
  }

  function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const g=ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,'#78a0ff'); g.addColorStop(0.6,'#3b6cff'); g.addColorStop(1,'#2b3f6b');
    ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#153050';
    ctx.beginPath();
    ctx.moveTo(0,350); ctx.lineTo(120,230); ctx.lineTo(260,330); ctx.lineTo(400,200);
    ctx.lineTo(560,340); ctx.lineTo(720,230); ctx.lineTo(900,350);
    ctx.lineTo(900,480); ctx.lineTo(0,480); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#233447'; ctx.fillRect(0,world.groundY,world.width,canvas.height-world.groundY);
    drawPlayer(); enemies.forEach(drawEnemy);
    ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(10,10,170,40);
    ctx.fillStyle='#fff'; ctx.font='14px Arial';
    ctx.fillText('Score: '+score,18,30);
    ctx.fillText('Level: '+(stageIndex+1),100,30);
  }

  function drawPlayer(){
    ctx.fillStyle='#ffe4b5';
    ctx.fillRect(player.x,player.y,player.w,player.h);
    ctx.fillStyle='#222';
    ctx.fillRect(player.x+6,player.y+12,6,6);
    ctx.fillRect(player.x+player.w-12,player.y+12,6,6);
    ctx.fillStyle='#c0c0c0';
    if(player.facing>0) ctx.fillRect(player.x+player.w,player.y+18,24,6);
    else ctx.fillRect(player.x-24,player.y+18,24,6);
  }

  function drawEnemy(e){
    const t=1-(e.hp/e.maxHp);
    ctx.fillStyle=`rgb(${200-t*80},${80+t*80},80)`;
    ctx.fillRect(e.x,e.y,e.w,e.h);
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(e.x,e.y-8,e.w,5);
    ctx.fillStyle='rgba(255,80,80,0.95)';
    ctx.fillRect(e.x,e.y-8,e.w*(e.hp/e.maxHp),5);
  }

  resetGame();
})();
