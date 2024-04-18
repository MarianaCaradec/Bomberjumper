let config = {
    type: Phaser.AUTO,// para que use WEBGL y si el navegador no lo permite, usa CANVAS
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 300},
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let score = 0;
let scoreText;
let gameOver = false;

let game = new Phaser.Game(config);


function preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('bomb', 'assets/bomb.png')
    this.load.spritesheet('dude', 'assets/dude.png',{frameWidth: 32, frameHeight: 48}); // para el width de cada dude se divide el ancho total de la img x 9 (se carga en sheet porque es una secuencia de fotogramas, no una img)
}

function create() {
    // FONDO
    this.add.image(400, 300, 'sky');
    // this.add.image(400, 300, 'star');

    // PLATAFORMAS
    platforms = this.physics.add.staticGroup(); // se le asigna al grupo de elementos la propiedad de estatico: no se define su gravedad ni velocidad porque no se mueve
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();// se multiplican x 2 las proporciones de la img para la base (las img se posicionan segun su centro, no el punto de origen de la plataforma)
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(700, 200, 'ground');

    // JUGADOR
    player = this.physics.add.sprite(100, 450, 'dude');
    player.setCollideWorldBounds(true);
    player.setBounce(0.3);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', {start: 0, end: 3}), // la key left utiliza los fotogramas 0 1 2 y 3
        frameRate: 10, // se repite cada 10 fotogramas x seg
        repeat: -1 // la animacion debe volver a empezar cuando termine
    })
    this.anims.create({
        key: 'turn',
        frames: [{key: 'dude', frame: 4}],
        frameRate: 20,
    })
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', {start: 5, end: 8}), 
        frameRate: 10, 
        repeat: -1 
    })

    // cuando se crea un sprite con physics se le asigna la propiedad body que hace referencia a su cuerpo fisico en el sistema arcade de phaser
    // player.body.setGravityY(300);
    // este metodo permite variar el peso del objeto y por ende cuan rapido cae

    this.physics.add.collider(player, platforms);// para determinar si el player colisiona con la plataforma y que mantengas sus fisicas

    cursors = this.input.keyboard.createCursorKeys();

    // LLUVIA DE ESTRELLAS
    stars = this.physics.add.group({
        key: 'star',
        repeat: 11,// se repita el objeto 11 veces más: en total se tienen 12
        setXY: {x: 12, Y: 0, stepX: 70}
        // 1ra star: posicion 12, 2da: posicion 82. 3ra: posicion 152, etc (se usa 70 para sumarle para que se repartan equitativamente por toda la pantalla)
    })

    stars.children.iterate(function(child){
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        // para que reboten aleatoriamente entre 0 y 1
    })

    this.physics.add.collider(stars, platforms);

    this.physics.add.overlap(player, stars, collectStar, null, true);

    scoreText = this.add.text(16, 16, 'SCORE: 0', {fontSize: '32px', fill: 'white'})

    // BOMBAS
    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

}

function update() {
    if(gameOver) {
        return
    }

    if(cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if(cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else if(cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-340);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn', true);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText(`Score: ${score}`);

    if(stars.countActive(true) === 0){
        stars.children.iterate(function(child){
            child.enableBody(true, child.x, 0, true, true);
        });
    }

     // si la posicion x del jugador menor a 400 es true, se genera un num aleatorio entre 400 y 800 para asignarle a x, si es false se le asigna entre 0 y 400 a x (operador condicional ternario)
    let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
     // la posicion de la bomba en x depende de la var arriba creada
    let bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
     // establece una velocidad aleatoria en el eje X entre -200 y 200, y una constante de 20 en el eje Y
}


function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;
}