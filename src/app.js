import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import WebGL from 'three/examples/jsm/capabilities/WebGL.js'
import * as CANNON from 'cannon-es'

if (!WebGL.isWebGLAvailable()) {
    const warning = WebGL.getErrorMessage();
    document.getElementById('container').appendChild(warning);
    return;
}

// three.js variables
/** @type { THREE.Scene } */
let scene; 
/** @type { THREE.PerspectiveCamera } */
let camera; 
/** @type { THREE.Renderer } */
let renderer;
/** @type { THREE.Mesh } */
let mesh;
initThree();

// cannon.js variables
/** @type { CANNON.World } */
let world;
/** @type { CANNON.Body } */
let body;
initCannon();

function initThree() {
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Scene 
    scene = new THREE.Scene();

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);

    // Box
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function initCannon() {
    world = new CANNON.World();

    // Box
    const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    body = new CANNON.Body({
        mass: 1,
    });
    body.addShape(shape);
    body.angularVelocity.set(0, 10, 0);
    body.angularDamping = 0.5;
    world.addBody(body);
}


function animate() {
    requestAnimationFrame(animate);

    // Step the physics world
    world.fixedStep();

    // Copy coordinates from cannon.js to three.js
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);

    renderer.render(scene,camera);
}

animate();