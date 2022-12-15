import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import WebGL from 'three/examples/jsm/capabilities/WebGL.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js' 

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

// Car variables
let carModel;
let car;
let wheelModels;
let wheels;
initCar();

function initThree() {
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 5;

    // Scene 
    scene = new THREE.Scene();

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    // Sun 
    {
        const color = 0xffffff;
        const intensity = 1;
        const sunLight = new THREE.DirectionalLight(color, intensity);
        sunLight.position.set(0, 100, 0);
        sunLight.castShadow = true;
        scene.add(sunLight);
    }
    {
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.AmbientLight(color, intensity);
        scene.add(light);
    }
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
    world.addBody(body);
}

function initCar() {
    // WebGL
    const gltfLoader = new GLTFLoader();
    const url = 'models/Toyota AE86.glb';
    gltfLoader.load(url, (gltf) => {
        const root = gltf.scene;
        root.position.set(2, 0, 8);
        root.rotation.set(0, Math.PI, 0);
        root.scale.set(0.3, 0.3, 0.3);
        scene.add(root);
        root.castShadow = true;
        root.receiveShadow = true;
        carModel = root;
        wheelModels = root.getObjectByName('Car');
    });

    // Build the car chassis
    const chassisShape = new CANNON.Box(new CANNON.Vec3(2, 0.5, 1))
    const chassisBody = new CANNON.Body({ mass: 150 })
    chassisBody.addShape(chassisShape)
    chassisBody.position.set(0, 4, 0)
    chassisBody.angularVelocity.set(0, 0.5, 0)

    // Create the vehicle
    const vehicle = new CANNON.RaycastVehicle({
      chassisBody,
    })

    const wheelOptions = {
      radius: 0.5,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 30,
      suspensionRestLength: 0.3,
      frictionSlip: 1.4,
      dampingRelaxation: 2.3,
      dampingCompression: 4.4,
      maxSuspensionForce: 100000,
      rollInfluence: 0.01,
      axleLocal: new CANNON.Vec3(0, 0, 1),
      chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1),
      maxSuspensionTravel: 0.3,
      customSlidingRotationalSpeed: -30,
      useCustomSlidingRotationalSpeed: true,
    }

    wheelOptions.chassisConnectionPointLocal.set(-1, 0, 1)
    vehicle.addWheel(wheelOptions)

    wheelOptions.chassisConnectionPointLocal.set(-1, 0, -1)
    vehicle.addWheel(wheelOptions)

    wheelOptions.chassisConnectionPointLocal.set(1, 0, 1)
    vehicle.addWheel(wheelOptions)

    wheelOptions.chassisConnectionPointLocal.set(1, 0, -1)
    vehicle.addWheel(wheelOptions)

    car = vehicle;
}

function animate() {
    requestAnimationFrame(animate);

    // Step the physics world
    world.fixedStep();

    // Copy coordinates from cannon.js to three.js
    if (car) {
        const body = car.chassisBody;
        carModel.position.copy(body.position);
        carModel.quaternion.copy(body.quaternion);
    }
    

    renderer.render(scene,camera);
}

animate();

// Debug helper for 3D objects
function dumpObject(obj, lines = [], isLast = true, prefix = '') {
    const localPrefix = isLast ? '└─' : '├─';
    lines.push(`${prefix}${prefix ? localPrefix : ''}${obj.name || '*no-name*'} [${obj.type}]`);
    const newPrefix = prefix + (isLast ? '  ' : '│ ');
    const lastNdx = obj.children.length - 1;
    obj.children.forEach((child, ndx) => {
        const isLast = ndx === lastNdx;
        dumpObject(child, lines, isLast, newPrefix);
    });
    return lines;
}