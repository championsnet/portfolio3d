import * as THREE from '/vaggosstamko/3d/node_modules/three/build/three.module.js';
import ClearingLogger from '/vaggosstamko/3d/debug.module.js';
import dumpObject from '/vaggosstamko/3d/scenegraph.module.js';
import {GLTFLoader} from '/vaggosstamko/3d/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from '/vaggosstamko/3d/node_modules/three/examples/jsm/controls/OrbitControls.js';

let clock, mixer, scene, camera, renderer, currentTile, cameraPosition, directionalLight, hemiLight;
let totalTiles = 0;
let jumpAnimation; // Player animations
let playerOnFloor = false;
let gameStarted = false;
let actionAllowed = true;
let jumpStarted = false;
let player = null;
let playerDopple = null;
let playerV = new THREE.Vector3(0, 0, 0);
let jumpStartTime, jumpDuration, target;
let delta;

let onRightRotation = false;
let onLeftRotation = false;
let rotationTracker;
let playerDirection = "front";


const cameraOffset = new THREE.Vector3(0, 5, -6);
const lightOffset = new THREE.Vector3(-5, 20, -10);

// DEBUGGER
const logger = new ClearingLogger(document.querySelector('#debug pre'));

// RENDERER
{
  const canvas = document.querySelector('#c');
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    premultipliedAlpha: false,
    //antialias: true,
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
}

// CAMERA
const fov = 75;
const aspect = window.innerWidth / window.innerHeight;  // the canvas default
const near = 0.1;
const far = 100;
camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(cameraOffset.x, cameraOffset.y, cameraOffset.z);
camera.lookAt(0, 0, 50);

// CLOCK
clock = new THREE.Clock();

// SCENE
{
  scene = new THREE.Scene();
  const color = 0xFFFFEE;
  const near = 0;
  const far = 100;
  scene.fog = new THREE.Fog(color, near, far);
  scene.background = new THREE.Color('#ccffff');
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
directionalLight.shadow.camera.far = 300; // default
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
  const loader = new GLTFLoader();
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
    
    jumpAnimation = mixer.clipAction( gltf.animations[ 0 ] ); // access first animation clip
    jumpAnimation.clampWhenFinished = true;
    jumpAnimation.setLoop(THREE.LoopOnce);

    player.position.set(0, 0.5, 0);
    player.add(camera);
    
  });
}

// PLAYER DOPPLEGANGER
const geometry = new THREE.BoxGeometry(1, 0.001, 1);
const material = new THREE.MeshPhongMaterial({color});
playerDopple = new THREE.Mesh(geometry, material);
playerDopple.visible = false;
playerDopple.position.set(0, 0.5, 0);
scene.add(playerDopple);

let tilesJSON;
d3.json('/vaggosstamko/3d/resources/tiles.json').then(function (data) {
  tilesJSON = data;
  for (let i = 0; i < tilesJSON.length; i++) {
    makeTile(0xaa8844, tilesJSON[i].x, tilesJSON[i].y, tilesJSON[i].z);
  }
});
const tiles = [];
//const tileBodies = [];

// TILE MAKER
function makeTile(color, x, y, z) {
  const boxWidth = 9;
  const boxHeight = 1;
  const boxDepth = 9;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  const material = new THREE.MeshPhongMaterial({color});

  const cube = new THREE.Mesh(geometry, material);
  
  scene.add(cube);

  /*const shape = new CANNON.Box(new CANNON.Vec3(boxWidth/2, boxHeight/2, boxDepth/2));
  let mass = 0;
  const body = new CANNON.Body({mass, shape});
  body.position.set(x, y, z);
  world.addBody(body);*/

  cube.position.set(x, y, z);
  cube.receiveShadow = true;

  totalTiles += 1;
  tiles.push(cube);
  //tileBodies.push(body);
  return {
    threejs: cube,
    //cannonjs: body,
    number: totalTiles,
  };
}



currentTile = 0;
cameraPosition = 0;

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
  logger.log('test');
  logger.render(); // Debugger
  renderer.render(scene, camera);

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

window.addEventListener("click", () => {
  if (!gameStarted && player) {
    gameStarted = true;
  } else {
    if (actionAllowed && isJumpAllowed(playerDirection)) {
      console.log(playerDirection);
      jump(0.5, target);
    }
  }
});

window.addEventListener("keydown", function(event) {
  if (gameStarted && actionAllowed) {
    if (event.key == "ArrowRight") rotate('right');
    if (event.key == "ArrowLeft") rotate('left')
  }
});

function isJumpAllowed(direction) {
  if (direction in tilesJSON[currentTile]) {
    target = tilesJSON[currentTile][direction];
    if (currentTile == 0) target = 19;
    return true;
  }
  else return false;
}

function rotate(direction) {
  rotationTracker = player.rotation.y;
  actionAllowed = false;
  if (direction == 'right') {
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
    console.log(playerDirection);
  } else {
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
    console.log(playerDirection);
  }
}

function jump(duration, target) {
  
  actionAllowed = false;
  jumpStarted = false;
  jumpAnimation.setDuration(7*duration/5);
  jumpAnimation.play();
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
      console.log(playerV.y);
    }
    if (playerDopple.position.y <= tiles[target].position.y + 0.6) {
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
      jumpAnimation.reset();
      jumpAnimation.stop();
      playerV.y = 0;
      playerV.z = 0;
      playerV.x = 0;
      actionAllowed = true;
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
    }
  }

  // If on left rotation
  if (onLeftRotation) {
    player.rotation.y += 5 * delta;
    if (player.rotation.y - rotationTracker >= Math.PI / 2) {
      player.rotation.y = rotationTracker + Math.PI / 2;
      onLeftRotation = false;
      actionAllowed = true;
    }
  }
    
}

function animate() {
  delta = clock.getDelta();
  updatePhysics();
  logger.log(currentTile);

  requestAnimationFrame( animate );
  
  if ( mixer ) mixer.update( delta );

  renderer.render( scene, camera );
}

animate();

