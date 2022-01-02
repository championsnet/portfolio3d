import * as THREE from '/vaggosstamko/3d/node_modules/three/build/three.module.js';
import ClearingLogger from '/vaggosstamko/3d/debug.module.js';
import dumpObject from '/vaggosstamko/3d/scenegraph.module.js';
import {GLTFLoader} from '/vaggosstamko/3d/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { ImprovedNoise } from '/vaggosstamko/3d/node_modules/three/examples/jsm/math/ImprovedNoise.js';

let clock, mixer, scene, camera, renderer, currentTile, cameraPosition, directionalLight, hemiLight;
let totalTiles = 0;
const jumps = []; // Player jump animations
const rotationPoses = []; // Player rotation animations
let playerOnFloor = false;
let gameReady = false;
let gameStarted = false;
let actionAllowed = true;
let jumpStarted = false;
let player = null;
let playerDopple = null;
let playerV = new THREE.Vector3(0, 0, 0);
let jumpStartTime, jumpDuration, target;
let delta, randomJump;

let onRightRotation = false;
let onLeftRotation = false;
let rotationTracker;
let playerDirection = "front";


const cameraOffset = new THREE.Vector3(0, 6, -7);
const lightOffset = new THREE.Vector3(-5, 20, -10);

const loadManager = new THREE.LoadingManager();

// LOADING SCENE
loadManager.onLoad = function ( url, itemsLoaded, itemsTotal ) {

  document.querySelector('#start').style.opacity = 1;
  const toChange = document.getElementsByTagName('polyline');
  
  for (let i=0; i<toChange.length; i++) {
    toChange[i].classList.remove("stroke-animation");
    toChange[i].style.stroke = '#aa8844';
  }
	gameReady = true;
  console.log("ready");
};

// DEBUGGER
const logger = new ClearingLogger(document.querySelector('#debug pre'));

// RENDERER
{
  const canvas = document.querySelector('#c');
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    premultipliedAlpha: false,
    antialias: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
}

// CAMERA
const fov = 75;
const aspect = window.innerWidth / window.innerHeight;  // the canvas default
const near = 1;
const far = 500;
camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(cameraOffset.x, cameraOffset.y, cameraOffset.z);
camera.lookAt(0, 0, 50);

// CLOCK
clock = new THREE.Clock();

// SCENE
{
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xe6ffff );
  scene.fog = new THREE.FogExp2( 0xe6ffff, 0.0025 );
  scene.add(camera);
}

// LIGHTS
const color = 0xFFFF99;
const intensity = 1;
directionalLight = new THREE.DirectionalLight(color, intensity);
// Make light follow camera
scene.add(directionalLight);
directionalLight.position.set(lightOffset.x, lightOffset.y, lightOffset.z);
  
//Set up shadow properties for the light
const d = 15;
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = - d;
directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.top = d;
directionalLight.shadow.camera.bottom = - d;
directionalLight.shadow.mapSize.width = 512; // default
directionalLight.shadow.mapSize.height = 512; // default
directionalLight.shadow.camera.near = 0.5; // default
directionalLight.shadow.camera.far = 100; // default
//scene.add(directionalLight);

//const helper = new THREE.CameraHelper( directionalLight.shadow.camera );
//scene.add( helper );

const ambientLight = new THREE.AmbientLight( 0x404040, 0.7 ); // soft white light
scene.add( ambientLight);

hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444, 0.8 );
hemiLight.position.set( 0, 20, 0 );
scene.add( hemiLight);


// LOAD ASSETS
{
  const loader = new GLTFLoader(loadManager);
  loader.load("resources/models/alien.gltf", function(gltf) {
    player = gltf.scene;

    player.traverse( function ( object ) {
      if ( object.isMesh ) {
        object.castShadow = true;
      }
    });
    scene.add(player);
    directionalLight.target = player;
    scene.add( directionalLight.target );
    mixer = new THREE.AnimationMixer( gltf.scene );
    
    
    let animation = mixer.clipAction( gltf.animations[ 0 ] ); // access first animation clip
    animation.clampWhenFinished = true;
    animation.setLoop(THREE.LoopOnce);
    jumps.push(animation);

    animation = mixer.clipAction( gltf.animations[ 1 ] ); // access first animation clip
    animation.clampWhenFinished = true;
    animation.setLoop(THREE.LoopOnce);
    jumps.push(animation);

    // Right rotation
    animation = mixer.clipAction( gltf.animations[ 2 ] ); // access first animation clip
    animation.clampWhenFinished = true;
    animation.setLoop(THREE.LoopOnce);
    rotationPoses.push(animation);

    // Left rotation
    animation = mixer.clipAction( gltf.animations[ 3 ] ); // access first animation clip
    animation.clampWhenFinished = true;
    animation.setLoop(THREE.LoopOnce);
    rotationPoses.push(animation);

    player.position.set(0, 0.5, 0);
    player.add(camera);
  });

  loader.load("resources/models/scene.gltf", function(gltf) {
    const terrain = gltf.scene;
    scene.add(terrain);
    terrain.position.set(0, -20, 30);
    terrain.scale.set(30, 30, 30);
  });

  loader.load("resources/models/sign1.gltf", function(gltf) {
    const sign1 = gltf.scene;
    scene.add(sign1);
    sign1.position.set(4, 0.5, 4);
    sign1.scale.set(2, 2, 2);
    sign1.rotation.y = Math.PI/8;
  });
}

// PLAYER DOPPLEGANGER
{
  const geometry = new THREE.BoxGeometry(1, 0.001, 1);
  const material = new THREE.MeshPhongMaterial({color});
  playerDopple = new THREE.Mesh(geometry, material);
  playerDopple.visible = false;
  playerDopple.position.set(0, 0.5, 0);
  scene.add(playerDopple);
}

let tilesJSON;
d3.json('/vaggosstamko/3d/resources/tiles.json').then(function (data) {
  tilesJSON = data;
  for (let i = 0; i < tilesJSON.length; i++) {
    makeTile(0xaa8844, tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z);
    /*if (i == 0) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "left");
    if (i == 1) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "left");
    if (i == 3) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "right");
    if (i == 3) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "front");
    if (i == 6) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "back");
    if (i == 6) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "left");
    if (i == 8) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "left");
    if (i == 8) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "front");
    if (i == 13) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "front");
    if (i == 13) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "right");
    if (i == 14) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "right");
    if (i == 15) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "right");
    if (i == 15) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "back");
    if (i == 17) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "left");
    if (i == 19) makeGlass(tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z, "left");*/
  }
});
const tiles = [];

// TILE MAKER
function makeTile(color, x, y, z) {
  const boxWidth = 9;
  const boxHeight = 1;
  const boxDepth = 9;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  const material = new THREE.MeshPhongMaterial({color});

  const cube = new THREE.Mesh(geometry, material);
  
  scene.add(cube);

  cube.position.set(x, y, z);
  cube.receiveShadow = true;
  //makeGlass(cube.position, "left");
  //makeGlass(cube.position, "right");

  totalTiles += 1;
  tiles.push(cube);
  return {
    threejs: cube,
    number: totalTiles,
  };
}

// GLASS STAND MAKER
function makeGlass(x, y, z, direction) {

  const length = 9;
  let width = length;
  if (direction == "right" || direction == "left") width = 0.2;
  const height = 4.5;
  let depth = length;
  if (direction == "front" || direction == "back") depth = 0.2;

  const geometry = new THREE.BoxGeometry(width, height, depth);

  const material = new THREE.MeshPhysicalMaterial( {
    color: 0xffffff,
    transmission: 1,
    opacity: 1,
    metalness: 0,
    roughness: 0,
    ior: 1.52,
    thickness: 0.1,
    specularIntensity: 1,
    specularColor: 0xffffff,
  });

  const glass = new THREE.Mesh(geometry, material);
  
  scene.add(glass);
  y += height / 2;
  switch (direction) {
    case 'front': 
      z += length/2 + 0.2/2;
      break;
    case 'right': 
      x -= length/2 + 0.2/2;
      break;
    case 'back': 
      z -= length/2 + 0.2/2;
      break;
    case 'left':
      x += length/2 + 0.2/2;
      break;
  }
  glass.position.set(x, y, z);
  glass.receiveShadow = true;
}


currentTile = 0;
cameraPosition = 0;

// Resize display screen
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width  = canvas.clientWidth  * pixelRatio | 0;
  const height = canvas.clientHeight * pixelRatio | 0;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}
renderer.render(scene, camera);

function render(time) {
  time *= 0.001;  // convert time to seconds
  //logger.log('time:', time);
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

// Start game controls
document.querySelector('#loader').addEventListener("click", () => {
  if (!gameStarted && gameReady) {
    gameStarted = true;
    document.querySelector('#loader').classList.add('hidden');
  } 
});

// Jump controls
window.addEventListener("keydown", function(event) {
  if (gameStarted && actionAllowed && isJumpAllowed(playerDirection)) {
    if (event.key == " ") jump(0.5, target);
  }
});
window.addEventListener('swiped-up', function(e) {
  if (gameStarted && actionAllowed && isJumpAllowed(playerDirection)) {
    jump(0.5, target);
  }
});

// For disabling scrolling in mobiles
window.addEventListener('swiped-down', function(e) {
  return;
});

// Rotate controls
window.addEventListener("keydown", function(event) {
  if (gameStarted && actionAllowed) {
    if (event.key == "ArrowRight") rotate('right');
    if (event.key == "ArrowLeft") rotate('left')
  }
});
window.addEventListener("swiped-right", function(event) {
  if (gameStarted && actionAllowed) {
    rotate('right');
  }
});
window.addEventListener("swiped-left", function(event) {
  if (gameStarted && actionAllowed) {
    rotate('left');
  }
});

// Check if JUMP is allowed on specified direction
function isJumpAllowed(direction) {
  if (direction in tilesJSON[currentTile]) {
    target = tilesJSON[currentTile][direction];
    return true;
  }
  else return false;
}

// Initiate Rotation
function rotate(direction) {
  rotationTracker = player.rotation.y;
  actionAllowed = false;
  if (direction == 'right') {
    rotationPoses[1].play();
    rotationPoses[1].setDuration(0.3);
    onRightRotation = true;
    switch (playerDirection) {
      case 'front': 
        playerDirection = 'right';
        break;
      case 'right': 
        playerDirection = 'back';
        break;
      case 'back': 
        playerDirection = 'left';
        break;
      case 'left':
        playerDirection = 'front';
        break;
    }
  } else {
    rotationPoses[0].play();
    rotationPoses[0].setDuration(0.3);
    onLeftRotation = true;
    switch (playerDirection) {
      case 'front': 
        playerDirection = 'left';
        break;
      case 'right': 
        playerDirection = 'front';
        break;
      case 'back': 
        playerDirection = 'right';
        break;
      case 'left': 
        playerDirection = 'back';
        break;
    }
  }
}

// Initiate Jump
function jump(duration, target) {
  
  actionAllowed = false;
  jumpStarted = false;
  randomJump = findRandom(jumps.length);
  jumps[randomJump].setDuration(8*duration/5);
  jumps[randomJump].play();
  jumpDuration = duration;

  let requiredVy = 20 + Math.abs(tiles[target].position.y - tiles[currentTile].position.y);
  const requiredVz = (tiles[target].position.z - tiles[currentTile].position.z) / 10 * 10;
  const requiredVx = (tiles[target].position.x - tiles[currentTile].position.x) / 10 * 10;

  setTimeout(() => {
    playerV.y = requiredVy * 5/duration/5;
    playerV.z = requiredVz * 4/duration/5;
    playerV.x = requiredVx * 4/duration/5;
    jumpStartTime = clock.getElapsedTime();
    jumpStarted = true;
  }, duration/5 * 1000);
}

// Handle all movements
function updatePhysics() {
  // If on jump
  if (jumpStarted) {
    
    let timeCoefficient = (clock.elapsedTime - jumpStartTime)*4/jumpDuration/5;
    if (timeCoefficient >= 1) timeCoefficient = 1;
    playerDopple.position.y += playerV.y * Math.cos(Math.PI*timeCoefficient) * delta;
    camera.position.y -= playerV.y * Math.cos(Math.PI*timeCoefficient) * delta / 4;
    if (playerV.y > 80) 
    {
      camera.position.y += playerV.y * Math.cos(Math.PI*timeCoefficient) * delta / 4;
    }
    if (playerDopple.position.y <= tiles[target].position.y + 0.5) {
      playerDopple.position.y = tiles[target].position.y + 0.5;
      camera.position.y = cameraOffset.y;
    }

    playerDopple.position.z += playerV.z * delta;
    if (playerV.z >= 0) {
      if (playerDopple.position.z >= tiles[target].position.z) {
        playerDopple.position.z = tiles[target].position.z;
      }
    } else {
      if (playerDopple.position.z <= tiles[target].position.z) {
        playerDopple.position.z = tiles[target].position.z;
      }
    }
    

    playerDopple.position.x += playerV.x * delta;
    if (playerV.x >= 0) {
      if (playerDopple.position.x >= tiles[target].position.x) {
        playerDopple.position.x = tiles[target].position.x;
      }
    } else {
      if (playerDopple.position.x <= tiles[target].position.x) {
        playerDopple.position.x = tiles[target].position.x;
      }
    }
    

    if (playerDopple.position.y == tiles[target].position.y + 0.5 
        && playerDopple.position.z == tiles[target].position.z
        && playerDopple.position.x == tiles[target].position.x) {

      jumpStarted = false;
      currentTile = target;
      playerV.y = 0;
      playerV.z = 0;
      playerV.x = 0;
      
      setTimeout(() => {
        actionAllowed = true;
        jumps[randomJump].reset();
        jumps[randomJump].stop();
      }, 2*jumpDuration/8);
    }

    if (player) player.position.copy(playerDopple.position);
    directionalLight.lookAt(player.position.x, player.position.y, player.position.z);
    directionalLight.position.set(player.position.x + lightOffset.x, player.position.y + lightOffset.y, player.position.z + lightOffset.z);
  } 

  // If on right rotation
  if (onRightRotation) {
    player.rotation.y -= 5 * delta;
    if (player.rotation.y - rotationTracker <= -Math.PI / 2) {
      player.rotation.y = rotationTracker - Math.PI / 2;
      onRightRotation = false;
      actionAllowed = true;

      rotationPoses[1].reset();
      rotationPoses[1].stop();
    }
  }

  // If on left rotation
  if (onLeftRotation) {
    player.rotation.y += 5 * delta;
    if (player.rotation.y - rotationTracker >= Math.PI / 2) {
      player.rotation.y = rotationTracker + Math.PI / 2;
      onLeftRotation = false;
      actionAllowed = true;

      rotationPoses[0].reset();
      rotationPoses[0].stop();
    }
  }
    
}

// Get random int: 0-max
function findRandom(max) {
  const random = Math.floor(Math.random() * max) //Finds number between 0 - max
  return random;
}

// Handle all animation and object movements
function animate() {
  delta = clock.getDelta();
  updatePhysics();
  logger.log(currentTile);

  requestAnimationFrame( animate );
  
  if ( mixer ) mixer.update( delta );

  renderer.render( scene, camera );
}









animate();