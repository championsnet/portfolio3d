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
let jumpAllowed = true;
let jumpStarted = false;
//let world;
let player = null;
let playerDopple = null;
//let playerBody = null;
let playerV = new THREE.Vector3(0, 0, 0);
let jumpStartTime, jumpDuration;
let delta;

let registeredLastJump = true;

const cameraOffset = new THREE.Vector3(0, 6, -6);
const lightOffset = new THREE.Vector3(-5, 20, -10);

// Debugger
const logger = new ClearingLogger(document.querySelector('#debug pre'));

/*{
  world = new CANNON.World();
  world.gravity.set(0, -150, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;
}*/

// Renderer
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

// Camera
const fov = 75;
const aspect = window.innerWidth / window.innerHeight;  // the canvas default
const near = 0.1;
const far = 100;
camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(cameraOffset.x, cameraOffset.y, cameraOffset.z);
camera.lookAt(0, 0, 50);

// Clock
clock = new THREE.Clock();

// Scene
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

    /*const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    let mass = 100;
    playerBody = new CANNON.Body({mass, shape});
    playerBody.position.set(0, 1.5, 0);
    world.addBody(playerBody);*/
    
  });
}

// PLAYER DOPPLEGANGER
const geometry = new THREE.BoxGeometry(1, 0.001, 1);
const material = new THREE.MeshPhongMaterial({color});
playerDopple = new THREE.Mesh(geometry, material);
playerDopple.visible = false;
playerDopple.position.set(0, 0.5, 0);
scene.add(playerDopple);

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

for (let i = 0; i < 20; i++) {
  makeTile(0xaa8844, 0, i*2, i*10);
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
    if (jumpAllowed) {
      jump(0.5);
    }
  }
})

function jump(duration) {
  
  jumpAllowed = false;
  jumpAnimation.setDuration(duration);
  jumpAnimation.play();
  jumpDuration = duration;
  

  /*tileBodies[currentTile+1].addEventListener("collide", function listener(e){
    tileBodies[currentTile+1].removeEventListener("collide", listener);
    playerBody.velocity.y = 0; 
    playerBody.velocity.z = 0;
    jumpAllowed = true;
    registeredLastJump = false;
    
    
  } );*/

  setTimeout(() => {
    //playerBody.applyImpulse(new CANNON.Vec3(0, 5000, 0), playerBody.position);
    //playerBody.velocity.z = 40 * 3 / Math.PI;
    playerV.y = 22*4/duration/5;
    playerV.z = 10*4/duration/5;
    jumpStartTime = clock.getElapsedTime();
    jumpStarted = true;
  }, duration/5);
}

function updatePhysics() {
  //world.step(1/40);

  // If on jump
  if (jumpStarted) {
    /*if (playerBody.position.z >= tiles[currentTile + 1].position.z) {
      playerBody.velocity.z = 0;
    }*/
    
    let timeCoefficient = (clock.elapsedTime - jumpStartTime)*4/jumpDuration/5;
    if (timeCoefficient >= 1) timeCoefficient = 1;
    logger.log(timeCoefficient);
    playerDopple.position.y += playerV.y * Math.cos(Math.PI*timeCoefficient) * delta;
    if (playerDopple.position.y <= tiles[currentTile+1].position.y + 0.6) {
      playerDopple.position.y = tiles[currentTile+1].position.y + 0.5;
    }

    playerDopple.position.z += playerV.z * delta;
    if (playerDopple.position.z >= tiles[currentTile+1].position.z) {
      playerDopple.position.z = tiles[currentTile+1].position.z;
    }

    if (playerDopple.position.y == tiles[currentTile+1].position.y + 0.5 && playerDopple.position.z == tiles[currentTile+1].position.z) {
      jumpAllowed = true;
      jumpStarted = false;
      currentTile += 1;
      jumpAnimation.reset();
      jumpAnimation.stop();
      playerV.y = 0;
      playerV.z = 0;
    }

    if (player) player.position.copy(playerDopple.position);

    
  } 

  if (!registeredLastJump) {
    registeredLastJump = true;
    currentTile += 1;
    jumpAnimation.reset();
    jumpAnimation.stop();
  }

  if (player) {
    //player.position.copy(playerBody.position);
    //player.position.y += -1;
    
  }
    
}

function animate() {
  delta = clock.getDelta();
  updatePhysics();
  logger.log(currentTile);
  if (cameraPosition < currentTile) {
    camera.position.y += 0.2
    camera.position.z += 1

    directionalLight.lookAt(player.position.x, player.position.y, player.position.z);
    directionalLight.position.set(camera.position.x + lightOffset.x - cameraOffset.x, camera.position.y + lightOffset.y - cameraOffset.y, camera.position.z + lightOffset.z - cameraOffset.z);

    if (camera.position.z >= tiles[currentTile].position.z + cameraOffset.z) cameraPosition += 1;
  }

  requestAnimationFrame( animate );
  
  if ( mixer ) mixer.update( delta );

  renderer.render( scene, camera );
}

animate();

