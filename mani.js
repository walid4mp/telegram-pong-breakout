const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// الأصوات باستخدام Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq){
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

// إعداد Socket.io
const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || "ROOM1";
socket.emit('joinRoom', roomId);

// اللاعب
const paddle = {width:100, height:10, x: WIDTH/2-50, y: HEIGHT-30, speed:7};
let otherPaddle = {x: WIDTH/2-50, y: HEIGHT-30, width:100, height:10};

const ball = {x: WIDTH/2, y: HEIGHT/2, radius:10, speedX:5, speedY:5};

// إعداد الطوب
const bricks = [];
const rows=5, cols=8;
const brickWidth = WIDTH/cols -10;
const brickHeight = 20;
for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
        bricks.push({x:c*(brickWidth+10)+5, y:r*(brickHeight+5)+50, width:brickWidth, height:brickHeight, color:['red','green','blue','yellow','magenta'][r%5]});
    }
}

let score=0, lives=3, level=1;

// التحكم بالمضرب
let keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function sendPaddle(){
    socket.emit('updatePaddle', {room:roomId, x:paddle.x});
}

socket.on('updatePaddle', data => {
    if(data.id !== socket.id){
        otherPaddle.x = data.x;
    }
});

socket.on('ballUpdate', data => {
    ball.x = data.x;
    ball.y = data.y;
    ball.speedX = data.speedX;
    ball.speedY = data.speedY;
});

function resetBall(){
    ball.x = WIDTH/2;
    ball.y = HEIGHT/2;
    ball.speedX = 5 * (Math.random()<0.5?1:-1);
    ball.speedY = 5 * (Math.random()<0.5?1:-1);
}

function update(){
    if(keys['ArrowLeft'] && paddle.x>0) paddle.x -= paddle.speed;
    if(keys['ArrowRight'] && paddle.x+paddle.width<WIDTH) paddle.x += paddle.speed;

    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // الاصطدام بالحائط
    if(ball.x <=0 || ball.x>=WIDTH-ball.radius) { ball.speedX*=-1; playSound(400);}
    if(ball.y <=0) { ball.speedY*=-1; playSound(500);}
    if(ball.y >= HEIGHT){lives--; resetBall(); if(lives<=0){score=0;lives=3;level=1;}}

    // الاصطدام بالمضرب
    if(ball.y + ball.radius >= paddle.y && ball.x >= paddle.x && ball.x <= paddle.x+paddle.width){
        ball.speedY*=-1; playSound(600);
    }

    // الاصطدام بالطوب
    for(let i=bricks.length-1;i>=0;i--){
        let b=bricks[i];
        if(ball.x>=b.x && ball.x<=b.x+b.width && ball.y>=b.y && ball.y<=b.y+b.height){
            ball.speedY*=-1; bricks.splice(i,1); score+=10; playSound(800);
        }
    }

    sendPaddle();
    socket.emit('ballUpdate', {room:roomId, x:ball.x, y:ball.y, speedX:ball.speedX, speedY:ball.speedY});
}

function draw(){
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    // الكرة
    ctx.beginPath();
    ctx.arc(ball.x,ball.y,ball.radius,0,Math.PI*2);
    ctx.fillStyle="white";
    ctx.fill();
    ctx.closePath();

    // المضارب
    ctx.fillStyle="white";
    ctx.fillRect(paddle.x,paddle.y,paddle.width,paddle.height);
    ctx.fillStyle="cyan";
    ctx.fillRect(otherPaddle.x,otherPaddle.y,otherPaddle.width,otherPaddle.height);

    // الطوب
    bricks.forEach(b=>{
        ctx.fillStyle=b.color;
        ctx.fillRect(b.x,b.y,b.width,b.height);
    });

    // النصوص
    ctx.fillStyle="white";
    ctx.font="20px Arial";
    ctx.fillText("Score: "+score,10,20);
    ctx.fillText("Level: "+level,10,45);
    ctx.fillText("Lives: "+lives,10,70);
}

function gameLoop(){update(); draw(); requestAnimationFrame(gameLoop);}
gameLoop();
