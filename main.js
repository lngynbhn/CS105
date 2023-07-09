import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { TGALoader } from 'three/addons/loaders/TGALoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';


let gui;
let stats;

let camera, renderer, scene, axes;
let plane;

let geometry, material, mesh, planeMesh, light, helper;

let loader = new TGALoader();
let textureLoader = new THREE.TextureLoader();
let textureCube;
let originalBackground;
let obControls, affineControls;

// GUI
const settings = {
    sceneSettings : {
        showaxes: true,
        background: 'Color',
        color: '#828282',
        plane_color: '#ababab',
        plane_texture: 'Color'
    },

    geometry: {
        scale: 1,
        shape: 'Hình cầu',
        material: 'Phong',
        texture: 'None',
        model: 'None',
        Points: false,
        wireframe: false,
        color: 0x7a6c6c,
    },

    affine: {
        mode: 'None',
        reset: function() { resetTransformation(); }
    },

    light: {
        source: 'Directional Light',
        showHelper: true,
        enable: true,
        shadow: true,
        intensity: 2,
        color: 0xffffff,
        posX: -5,
        posY: 5,
        posZ: 0,
        angle: 0.5,
    },

    perspective: {
        fov: 104,
        near: 0.1,
        far: 100,
        posX: -2,
        posY: 2,
        posZ: 4,
        lookX: 0,
        lookY: 0,
        lookZ: 0
    },

    Points:{
        play: false,
    },

    animation: {
        go_type: 'None',
        rotate_type: 'None',
        scale: false,
        color_change: false,
    }
}

init()
initGUI()
animate()

function init() {

    // Perspective
    camera = new THREE.PerspectiveCamera(
        settings.perspective.fov, 
        window.innerWidth / window.innerHeight, 
        settings.perspective.near, 
        settings.perspective.far
    )
    camera.position.set(settings.perspective.posX, settings.perspective.posY, settings.perspective.posZ)
    camera.lookAt(settings.perspective.lookX, settings.perspective.lookY, settings.perspective.lookZ)

    renderer = new THREE.WebGLRenderer( { antialias: true } )
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    document.body.appendChild(renderer.domElement)

    // Scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(settings.sceneSettings.color)
    
    // AxesHelper
    axes = new THREE.AxesHelper(5)
    scene.add(axes)

    // Plane
    geometry = new THREE.CircleBufferGeometry(5, 32); // Radius: 5, 32 segments
    let planeMat = new THREE.MeshPhongMaterial({ color: 0xababab, side: THREE.DoubleSide })
    plane = new THREE.Mesh(geometry, planeMat)
    planeMesh = new THREE.Mesh(geometry, planeMat)
    planeMesh.rotation.x = -Math.PI / 2
    planeMesh.position.y = -0.5
    planeMesh.receiveShadow = true // Receive shadow on plane
    scene.add(planeMesh)

    // Geometry
    geometry = new THREE.SphereBufferGeometry(1, 32, 32)
    material = new THREE.MeshPhongMaterial({ color: settings.geometry.color, side: THREE.DoubleSide })
    mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(0, 0.5, 0)
    mesh.castShadow = true
    mesh.receiveShadow = false
    scene.add(mesh)

    // 3D Model
    // const objLoader = new OBJLoader();

    // Environment Map Textures
    const urls = [ 'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png' ];
    textureCube = new THREE.CubeTextureLoader().setPath( 'textures/pisa/' ).load( urls );

    // Light
    light = new THREE.DirectionalLight(settings.light.color, 2)
    light.position.set(settings.light.posX, settings.light.posY, settings.light.posZ)
    light.castShadow = true

    // Light Helper
    helper = new THREE.DirectionalLightHelper(light, 2)
    scene.add(helper)

    // Shadow
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024
    light.shadow.camera.near = 0.5
    light.shadow.camera.far = 50

    scene.add(light)

    // transform controls
    obControls = new OrbitControls(camera, renderer.domElement)
    obControls.enableDamping = true
    obControls.dampingFactor = 0.25
    obControls.enableZoom = true
    obControls.minDistance = 0.5
    obControls.maxDistance = 1000
    obControls.minPolarAngle = 0
    obControls.maxPolarAngle = Math.PI / 2

    // Affine 
    affineControls = new TransformControls(camera, renderer.domElement)
    affineControls.addEventListener('change', () => {
        renderer.render(scene, camera)
    })
    affineControls.addEventListener('dragging-changed', (event) => {
        if (event.value) {
            obControls.enabled = false
        } else {
            obControls.enabled = true
        }
    })
    scene.add(affineControls)

    // stats
    stats = new Stats()
    stats.showPanel(0)
    document.body.appendChild(stats.dom)

    window.addEventListener('resize', onWindowResize, false)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.render(scene, camera)
}

function resetTransformation() {
    mesh.position.set(0, 0.5, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    affineControls.update();
}

function animate() {
    requestAnimationFrame(animate)

    if (settings.animation.go_type !== 'None') {
        switch (settings.animation.go_type) {
            case 'Lên xuống':
                mesh.position.y = Math.sin(performance.now() * 0.001) * 1
                break
            case 'Qua lại':
                mesh.position.x = Math.sin(performance.now() * 0.001) * 1
                break
            case 'Tiến lùi':
                mesh.position.z = Math.sin(performance.now() * 0.001) * 1
                break
            case 'Vòng quanh':
                mesh.position.x = Math.sin(performance.now() * 0.001) * 1
                mesh.position.z = Math.cos(performance.now() * 0.001) * 1
                break
            default:
                break
    }}

    if (settings.animation.rotate_type !== 'None') {
        switch (settings.animation.rotate_type) {
            case 'Lên xuống':
                mesh.position.y = Math.sin(performance.now() * 0.001) * 1
                break
            case 'Qua lại':
                mesh.position.x = Math.sin(performance.now() * 0.001) * 1
                break
            case 'Tiến lùi':
                mesh.position.z = Math.sin(performance.now() * 0.001) * 1
                break
            case 'Vòng quanh':
                mesh.position.x = Math.sin(performance.now() * 0.001) * 1
                mesh.position.z = Math.cos(performance.now() * 0.001) * 1
                break
            case 'Xoay theo X':
                mesh.rotation.x = performance.now() * 0.0015
                break
            case 'Xoay theo Y':
                mesh.rotation.y = performance.now() * 0.0015
                break
            case 'Xoay theo Z':
                mesh.rotation.z = performance.now() * 0.0015
                break
            default:
                break
    }}

    if (settings.animation.scale) {
        mesh.scale.set(
            Math.sin(performance.now() * 0.001) + 1,
            Math.sin(performance.now() * 0.001) + 1,
            Math.sin(performance.now() * 0.001) + 1
        );
    }

    if (settings.animation.color_change) {
        mesh.material.color.setRGB(
            Math.sin(performance.now() * 0.001),
            Math.cos(performance.now() * 0.001),
            Math.sin(performance.now() * 0.001)
        );
    }

    stats.update()
    renderer.render(scene, camera)
}

function initGUI() {
    gui = new GUI()

    // Scene Settings 
    let scene_gui = gui.addFolder('Cài đặt scene ')

    // Scene Background
    scene_gui.addColor(settings.sceneSettings, 'color').name('Background Color').onChange(() => {
        if (settings.sceneSettings.background === 'color') {
            scene.background = new THREE.Color(settings.sceneSettings.color);
        }
        originalBackground = scene.background;
    });
    scene_gui.add(settings.sceneSettings, 'background', {
        'Color': 'color',
        'Sea': 'textures/background/sea.jpg',
        'Nature': 'textures/background/nature.jpg',
        'Galaxy': 'textures/background/galaxy.jpg'
    }).name('Background Texture').onChange(() => {
        if (settings.sceneSettings.background === 'color') {
            scene.background = new THREE.Color(settings.sceneSettings.color);
        } else {
            var texturePath = settings.sceneSettings.background;
            var backgroundTexture = textureLoader.load(texturePath);
            scene.background = backgroundTexture;
        }
        originalBackground = scene.background;
    });
    
    // Scene Plane
    scene_gui.addColor(settings.sceneSettings, 'plane_color').name('Plane Color').onChange(() => {
        plane.material.color.set(settings.sceneSettings.plane_color);
    });
    scene_gui.add(settings.sceneSettings, 'plane_texture', {
        'Color': 'plane_color',
        'Grass': 'textures/plane/grass.jpg',
        'Dry': 'textures/plane/dry.jpg',
    }).name('Plane Texture').onChange(() => {
        if (settings.sceneSettings.plane_texture === 'plane_color') {
            plane.material.color.set(settings.sceneSettings.plane_color);
            plane.material.map = null;
            plane.material.needsUpdate = true;
        } else {
            var texturePath = settings.sceneSettings.plane_texture;
            var planeTexture = textureLoader.load(texturePath);
            plane.material.map = planeTexture;
            plane.material.needsUpdate = true;
        }
    });

    scene_gui.add(settings.sceneSettings, 'showaxes').name('Hiển thị trục').onChange(() => {
        if (settings.sceneSettings.showaxes) {
            scene.add(axes)
        } else {
            scene.remove(axes)
        }
    })

    // Geometry
    let geo_gui = gui.addFolder('Khối hình');

    geo_gui.add(settings.geometry, 'shape', 
                ['Hình cầu', 
                'Hình hộp', 
                'Hình nón', 
                'Hình trụ', 
                'Bánh xe', 
                'Ấm trà', 
                'Nút thắt', 
                'Khối 20 mặt',
                'CS105',
            ]).name('Hình khối').onChange(() => {
        if (settings.geometry.shape === 'Hình hộp') {
            geometry = new THREE.BoxBufferGeometry(1.3, 1.3, 1.3)
        } else if (settings.geometry.shape === 'Hình cầu') {
            geometry = new THREE.SphereBufferGeometry(1, 32, 32)
        } else if (settings.geometry.shape === 'Hình nón') {
            geometry = new THREE.ConeBufferGeometry(1, 2, 16)
        } else if (settings.geometry.shape === 'Hình trụ') {
            geometry = new THREE.CylinderBufferGeometry(1, 1, 1.5, 32)
        } else if (settings.geometry.shape === 'Bánh xe') {
            geometry = new THREE.TorusBufferGeometry(0.8, 0.3, 32, 32)
        } else if (settings.geometry.shape === 'Ấm trà') {
            geometry = new TeapotGeometry(0.5)
        } else if (settings.geometry.shape === 'Nút thắt') {
            geometry = new THREE.TorusKnotBufferGeometry(0.7, 0.2, 32, 32)
        } else if (settings.geometry.shape === 'Khối 20 mặt') {
            geometry = new THREE.IcosahedronGeometry(1, 0);
        } else if (settings.geometry.shape === 'CS105') {
            const text = 'CS105';
            const fontLoader = new FontLoader();
            fontLoader.load('fonts/optimer_bold.typeface.json', (font) => {
                const textGeometry = new TextGeometry(text, {
                    font: font,
                    size: 1,
                    height: 0.2,
                    curveSegments: 12,
                    bevelEnabled: false,
                });
                geometry = textGeometry;
                mesh.geometry = geometry
                mesh.position.set(0, 0.5, 0)
            })
        }
        mesh.geometry = geometry
        mesh.position.set(0, 0.5, 0)
    })

    geo_gui.addColor(settings.geometry, 'color').name('Color').onChange(() => {
        if (settings.geometry.material === 'Points') {
            material = new THREE.PointsMaterial({color: settings.geometry.color, side: THREE.DoubleSide})
        } else if (settings.geometry.material === 'Basic') {
            material = new THREE.MeshBasicMaterial({ color: settings.geometry.color, side: THREE.DoubleSide })
        } else if (settings.geometry.material === 'Lambert') {
            material = new THREE.MeshLambertMaterial({ color: settings.geometry.color, side: THREE.DoubleSide })
        } else if (settings.geometry.material === 'Phong') {
            material = new THREE.MeshPhongMaterial({ color: settings.geometry.color, side: THREE.DoubleSide })
        } else if (settings.geometry.material === 'Lines') {
            material = new THREE.LineBasicMaterial({ color: settings.geometry.color, side: THREE.DoubleSide}) 
        } else if (settings.geometry.material === 'Wireframe') {
            material = new THREE.MeshBasicMaterial({ color: settings.geometry.color, wireframe: true, side: THREE.DoubleSide})
        }
        mesh.material = material
    })


    geo_gui.add(settings.geometry, 'material', 
    [   'Basic',
        'Points', 
        'Lines', 
        'Wireframe',
        'Lambert', 
        'Phong',
    ]).name('Kiểu vẽ').onChange(() => {
        
        if (settings.geometry.material === 'Basic') {
            scene.remove(mesh)
            material = new THREE.MeshBasicMaterial({ color: settings.geometry.color, side: THREE.DoubleSide })
            mesh = new THREE.Mesh(geometry, material)
        } else if (settings.geometry.material === 'Points') {
            scene.remove(mesh)
            material = new THREE.PointsMaterial({color: settings.geometry.color, side: THREE.DoubleSide, size: 1})
            mesh = new THREE.Points(geometry,material)
        } else if (settings.geometry.material === 'Wireframe') {
            scene.remove(mesh)
            material = new THREE.MeshBasicMaterial({ color: settings.geometry.color, wireframe: true, side: THREE.DoubleSide })
            mesh = new THREE.Mesh(geometry, material)
        } else if (settings.geometry.material === 'Lambert') {
            scene.remove(mesh)
            material = new THREE.MeshLambertMaterial({ color: settings.geometry.color, side: THREE.DoubleSide })
            mesh = new THREE.Mesh(geometry, material)
        } else if (settings.geometry.material === 'Phong') {
            scene.remove(mesh)
            material = new THREE.MeshPhongMaterial({ color: settings.geometry.color, side: THREE.DoubleSide })
            mesh = new THREE.Mesh(geometry, material)
        } else if (settings.geometry.material === 'Lines') {
            scene.remove(mesh)
            material = new THREE.LineBasicMaterial({ color: settings.geometry.color, side: THREE.DoubleSide})
            mesh = new THREE.Line(geometry, material);
        
        } 

        mesh.position.set(0, 0.5, 0)
        mesh.castShadow = true
        mesh.receiveShadow = false
        scene.add(mesh)
    })

    geo_gui.add(settings.geometry, 'texture', 
    [   
        'None',
        'Stone Floor', 
        'Ceiling',
        'Blending',
        'Reflection',
        'Import Texture', 
    ]).name('Texture').onChange(() => {
        
        if (settings.geometry.texture === 'None') {
            scene.remove(mesh)
            material = new THREE.MeshPhongMaterial({ color: settings.geometry.color, side: THREE.DoubleSide })
            mesh = new THREE.Mesh(geometry, material) 
        } else if (settings.geometry.texture === 'Stone Floor') {
            scene.remove(mesh)
            material = new THREE.MeshPhongMaterial({
                shininess: 50,
                map: textureLoader.load('textures/stone_floor/base.jpg'),
                aoMap: textureLoader.load('textures/stone_floor/ambient_occlusion.jpg'),
                specularMap: textureLoader.load('textures/stone_floor/height.jpg'),
                normalMap: textureLoader.load('textures/stone_floor/normal.jpg'),
            })
            mesh = new THREE.Mesh(geometry, material)

        } else if (settings.geometry.texture === 'Ceiling') {
            scene.remove(mesh)
            material = new THREE.MeshStandardMaterial({
            
                map: textureLoader.load('textures/ceiling/base.jpg'),
                roughnessMap: textureLoader.load('textures/ceiling/roughness.jpg'),
                metalnessMap: textureLoader.load('textures/ceiling/metallic.jpg'),
                normalMap: textureLoader.load('textures/ceiling/normal.jpg'),
                roughness: 0.2,
				metalness: 0.2,
            })
            mesh = new THREE.Mesh(geometry, material)

        } else if (settings.geometry.texture === 'Blending') {
            scene.remove(mesh)
            material = new THREE.MeshBasicMaterial({
                map: textureLoader.load('textures/shells.jpg'),
                side: THREE.DoubleSide})
		    material.blending = THREE.MultiplyBlending ;
            mesh = new THREE.Mesh(geometry, material)

        } else if (settings.geometry.texture === 'Reflection') {
            scene.remove(mesh)
            material = new THREE.MeshPhongMaterial( { envMap: textureCube, side: THREE.DoubleSide } );
            mesh = new THREE.Mesh(geometry, material)
            scene.background = textureCube;

        } else if (settings.geometry.texture === 'Import Texture') {
            scene.remove(mesh)
            let fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = handleTextureFile;
            fileInput.click();

            function handleTextureFile(event) {
                let file = event.target.files[0];
                let reader = new FileReader();
                reader.onload = function (e) {
                    let textureUrl = e.target.result;
                    let texture = new THREE.TextureLoader().load(textureUrl);
                    material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
                    mesh.material = material;
                };
                reader.readAsDataURL(file);
            }
        }

        mesh.position.set(0, 0.5, 0)
        mesh.castShadow = true
        mesh.receiveShadow = false
        scene.add(mesh)

        // Restore the original scene background
        if (settings.geometry.texture !== 'Reflection') {
            scene.background = originalBackground;
        }
    })

    geo_gui.add(settings.geometry, 'scale', 0.1, 10).name('Scale').onChange(() => {
        if (mesh) {
            mesh.scale.set(settings.geometry.scale, settings.geometry.scale, settings.geometry.scale)
        }
    })

    // Affine
    let affine_gui = gui.addFolder('Biến đổi Affine')

    affine_gui.add(settings.affine, 'mode', 
    [   'None', 
        'Translation', 
        'Rotation', 
        'Scaling']
    ).name('Phép biến đổi').onChange(() => {

    if (settings.affine.mode === 'None') {
        affineControls.detach()
    } else if (settings.affine.mode === 'Translation') {
        affineControls.setMode('translate')
    } else if (settings.affine.mode === 'Rotation') {
        affineControls.setMode('rotate')
    } else if (settings.affine.mode === 'Scaling') {
        affineControls.setMode('scale')
    } 
    
    affineControls.attach(mesh)
})

    affine_gui.add(settings.affine, 'reset').name('Reset Transformation');

    // Light
    let light_gui = gui.addFolder('Chiếu sáng')
    light_gui.add(settings.light, 'source', 
        [   
            'Ambient Light',
            'Hemisphere Light',
            'Directional Light',
            'Point Light', 
            'Spot Light', 
        ]
    ).name('Nguồn sáng').onChange(() => {
        scene.remove(light)
        if (helper !== null) {
            scene.remove(helper);
        }

        if (settings.light.source === 'Directional Light') {
            light = new THREE.DirectionalLight(settings.light.color, 2)
            helper = new THREE.DirectionalLightHelper(light, 2)

        } else if (settings.light.source === 'Ambient Light') {
            light = new THREE.AmbientLight(settings.light.color, 2)
            helper = null

        } else if (settings.light.source === 'Hemisphere Light') {
            light = new THREE.HemisphereLight(settings.sceneSettings.color, settings.sceneSettings.plane_color, 2)
            helper = new THREE.HemisphereLightHelper(light, 2)

        } else if (settings.light.source === 'Point Light') {
            light = new THREE.PointLight(settings.light.color, 2, 50)
            helper = new THREE.PointLightHelper(light);

        } else if (settings.light.source === 'Spot Light') {
            light = new THREE.SpotLight(settings.light.color, 2, 50)
            helper = new THREE.SpotLightHelper(light);

        } 

        light.position.set(settings.light.posX, settings.light.posY, settings.light.posZ)
        light.castShadow = settings.light.shadow
        scene.add(light)

        if (settings.light.showHelper && helper !== null) {
            scene.add(helper);
        }
    })

    light_gui.add(settings.light, 'showHelper').name('Hiển thị Helper').onChange(() => {
        if (settings.light.showHelper && helper !== null) {
            scene.add(helper);
        } else if (!settings.light.showHelper && helper !== null) {
            scene.remove(helper);
        }
    })

    light_gui.addColor(settings.light, 'color').name('Color').onChange(() => {
        light.color = new THREE.Color(settings.light.color)
        helper.update()
    })
    
    light_gui.add(settings.light, 'intensity', 0, 10).name('Intensity').onChange(() => {
        light.intensity = settings.light.intensity
    })

    light_gui.add(settings.light, 'posX', -10, 10).name('Tọa độ X').onChange(() => {
        light.position.set(settings.light.posX, settings.light.posY, settings.light.posZ)
    })

    light_gui.add(settings.light, 'posY', -10, 10).name('Tọa độ Y').onChange(() => {
        light.position.set(settings.light.posX, settings.light.posY, settings.light.posZ)
    })

    light_gui.add(settings.light, 'posZ', -10, 10).name('Tọa độ Z').onChange(() => {
        light.position.set(settings.light.posX, settings.light.posY, settings.light.posZ)
    })

    light_gui.add(settings.light, 'shadow', false).name('Đổ bóng').onChange(() => {
        light.castShadow = settings.light.shadow
    })

    light_gui.add(settings.light, 'angle', 0, Math.PI/3).name('Góc (SpotLight)').onChange(() => {
        light.angle = settings.light.angle
        helper.update()
    })

    // Perspective Projection
    let perspective_gui = gui.addFolder('Chiếu phối cảnh')
    perspective_gui.add(settings.perspective, 'fov', 40, 150).name('Trường nhìn').onChange(() => {
        camera.fov = settings.perspective.fov
        camera.updateProjectionMatrix()
    })

    perspective_gui.add(settings.perspective, 'near', 0.1, 4).name('Near').onChange(() => {
        camera.near = settings.perspective.near
        camera.updateProjectionMatrix()
    })

    perspective_gui.add(settings.perspective, 'far', 100, 1000).name('Far').onChange(() => {
        camera.far = settings.perspective.far
        camera.updateProjectionMatrix()
    })

    perspective_gui.add(settings.perspective, 'posX', -10, 10).name('Tọa độ X').onChange(() => {
        camera.position.set(settings.perspective.posX, settings.perspective.posY, settings.perspective.posZ)
    })

    perspective_gui.add(settings.perspective, 'posY', -10, 10).name('Tọa độ Y').onChange(() => {
        camera.position.set(settings.perspective.posX, settings.perspective.posY, settings.perspective.posZ)
    })

    perspective_gui.add(settings.perspective, 'posZ', -10, 10).name('Tọa độ Z').onChange(() => {
        camera.position.set(settings.perspective.posX, settings.perspective.posY, settings.perspective.posZ)
    })

    // animation
    let animation_gui = gui.addFolder('Animation')
    
    animation_gui.add(settings.animation, 'go_type', 
        [   'None',
            'Lên xuống', 
            'Qua lại', 
            'Tiến lùi', 
            'Vòng quanh', 
        ]).name('Di chuyển')

    animation_gui.add(settings.animation, 'rotate_type', 
        [   'None',
            'Xoay theo X', 
            'Xoay theo Y', 
            'Xoay theo Z', 
        ]).name('Xoay')

    animation_gui.add(settings.animation, 'scale', false).name('Thu phóng')
    
    animation_gui.add(settings.animation, 'color_change', false).name('Đổi màu')


}