/**
 * XMLscene class, representing the scene that is to be rendered.
 */
class XMLscene extends CGFscene {
    /**
     * @constructor
     * @param {MyInterface} myinterface 
     */
    constructor(myinterface) {
        super();

        this.interface = myinterface;
    }

    /**
     * Initializes the scene, setting some WebGL defaults, initializing the camera and the axis.
     * @param {CGFApplication} application
     */
    init(application) {
        super.init(application);

        this.appearance = new CGFappearance(this.scene);

        this.sceneInited = false;

        //Currently active camera's numeric ID
        this.activeCamera = 0;
        
        //Cameras numeric IDs
        this.cameraIds = {};

        this.initCameras();

        this.enableTextures(true);

        this.gl.clearDepth(100.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.axis = new CGFaxis(this);
        this.displayAxis = true;
        this.displayNormals = false;
        this.displayNormals_before = false;

        this.setUpdatePeriod(100);

        this.loadingProgressObject=new MyRectangle(this, -1, -.1, 1, .1, 1, 1);
        this.loadingProgress=0;

        this.defaultAppearance=new CGFappearance(this); 

        this.setPickEnabled(true);

        this.cameraAnimation = null;
        //this.testBoard = new MyGameBoard(this);
        //this.testBoard.create();

        //this.testPiece1 = new MyPiece(this, "purple");
        //this.testPiece2 = new MyPiece(this, "green");
        //this.testPiece3 = new MyPiece(this, "purple");
        //this.testBoard.addPiece(this.testPiece1, 1, 1);
        //this.testBoard.addPiece(this.testPiece2, 3, 4);
        //this.testBoard.addPiece(this.testPiece3, 23, 13);

        this.gameboardPos = mat4.create(); //GAMEBOARD POSITION
    }

    initMaterials(){
        this.materials = [];

        for(var key in this.graph.materials) {
            var info = this.graph.materials[key];
        
            var mat = new CGFappearance(this);
            mat.setShininess(info[0]);
            mat.setSpecular(info[1][0], info[1][1], info[1][2], 1);
            mat.setDiffuse(info[2][0], info[2][1], info[2][2], 1);
            mat.setAmbient(info[3][0], info[3][1], info[3][2], 1);
            mat.setEmission(info[4][0], info[4][1], info[4][2], 1);

            this.materials[key] = mat;
        }
    }

    initTextures(){
        this.textures = [];

        
        for(var key in this.graph.textures){
            var info = this.graph.textures[key];
            if(info != 0) {
                var tex = new CGFtexture(this, info);
                this.textures[key] = tex;
            }
        }
    }

    /**
     * Initializes the scene cameras.
     */
    initCameras() {
        var i = 0;
        this.cameras = [];
        if(this.sceneInited) {
            for(var key in this.graph.views) {
                var info = this.graph.views[key];
                
                if(info[0] == "p") {
                    this.cameras[key] = new CGFcameraResettable(info[1],info[2],info[3],vec3.fromValues(info[4][0],info[4][1],info[4][2]),
                                        vec3.fromValues(info[5][0],info[5][1],info[5][2]));
                } else {
                    this.cameras[key] = new CGFcameraOrthoResettable(info[1],info[2],info[3],info[4],info[5],info[6],
                                        vec3.fromValues(info[7][0],info[7][1],info[7][2]),
                                        vec3.fromValues(info[8][0],info[8][1],info[8][2]),
                                        vec3.fromValues(info[9][0],info[9][1],info[9][2]));
                }

                if (key == this.graph.defaultView) {
                    this.activeCamera = key;
                    this.camera = this.cameras[key];
                    this.interface.setActiveCamera(this.camera);
                }
                this.cameraIds[key] = i; //adding a numeric value
                i++;
            }
        } else {
            this.camera = new CGFcameraResettable(0.4, 0.1, 500, vec3.fromValues(20, 10, 20), vec3.fromValues(0, 0, 0));
        }
    }

    /**
     * Updated the currently active camera. Also resets it's attributes to the ones set to at the beggining.
     */
    updateCamera() {
        this.nextCamera = this.cameras[Object.keys(this.cameras)[this.activeCamera]];
        this.nextCamera.resetCamera();
        let startCamPos = [this.camera.r[0], this.camera.r[1], this.camera.r[2]];
        let endCamPos = [this.nextCamera.originalR[0], this.nextCamera.originalR[1], this.nextCamera.originalR[2]];
        let startCamTarget = [this.camera.n[0], this.camera.n[1], this.camera.n[2]];
        let endCamTarget = [this.nextCamera.originalN[0], this.nextCamera.originalN[1], this.nextCamera.originalN[2]];
        let startCamNear = this.camera.near;
        let endCamNear = this.nextCamera.near;
        let startCamFar = this.camera.far;
        let endCamFar = this.nextCamera.far;
        let startCamAngle = this.camera.fov;
        let endCamAngle = this.nextCamera.fov;
        let time =  Math.sqrt(Math.pow(endCamPos[0] - startCamPos[0], 2) + Math.pow(endCamPos[1] - startCamPos[1], 2) + Math.pow(endCamPos[2] - startCamPos[2], 2));

        this.cameraAnimation = new CameraInterpolator(startCamPos, endCamPos, startCamTarget, endCamTarget, startCamNear, endCamNear, startCamFar, endCamFar, startCamAngle, endCamAngle, time / 20);
        /*
        this.position = vec4.fromValues(this.originalR[0], this.originalR[1], this.originalR[2], 0);
        this.target = vec4.fromValues(this.originalN[0], this.originalN[1], this.originalN[2], 0);
        */
        //this.interface.setActiveCamera(this.camera);
    }

    // logPicking() {
	// 	if (this.pickMode == false) {
	// 		if (this.pickResults != null && this.pickResults.length > 0) {
	// 			for (var i = 0; i < this.pickResults.length; i++) {
	// 				var obj = this.pickResults[i][0];
	// 				if (obj) {
    //                     var customId = this.pickResults[i][1];
    //                     if(customId > 100){
	// 					    console.log("Picked tile at line" + Math.floor(customId / 100) + " and column " + customId % 100);						
    //                     }
    //                     else{
    //                         console.log("Picked box with id = " + customId);
    //                     }
    //                 }
	// 			}
	// 			this.pickResults.splice(0, this.pickResults.length);
	// 		}
	// 	}
	// }

    /**
     * Initializes the scene lights with the values read from the XML file.
     */
    initLights() {

        // {light : enabled/disabled, ...}
        this.lightsStatus = {};

        // Lights index.
        var i = 0;

        // Reads the lights from the scene graph.
        for (var key in this.graph.lights) {
            if (i >= 8)
                break;              // Only eight lights allowed by WebCGF on default shaders.

            if (this.graph.lights.hasOwnProperty(key)) {
                var graphLight = this.graph.lights[key];

                this.lights[i].setPosition(...graphLight[1]);
                this.lights[i].setAmbient(...graphLight[2]);
                this.lights[i].setDiffuse(...graphLight[3]);
                this.lights[i].setSpecular(...graphLight[4]);

                this.lights[i].setVisible(true);
                if (graphLight[0])
                    this.lights[i].enable();
                else
                    this.lights[i].disable();

                this.lights[i].update();

                this.lightsStatus["light" + i] = graphLight[0];

                i++;
            }
        }


    }

    /**
     * Updates all the scene's lights
     */
    updateLights() {
        for (var i = 0; i < this.lights.length; i++) {
            if(this.lightsStatus["light" + i])
                this.lights[i].enable();
            else
                this.lights[i].disable();
            this.lights[i].setVisible(false);
            this.lights[i].update();
        }
    }

    /** Handler called when the graph is finally loaded. 
     * As loading is asynchronous, this may be called already after the application has started the run loop
     */
    onGraphLoaded() {
        this.axis = new CGFaxis(this, this.graph.referenceLength);

        this.setUpdatePeriod(10);

        this.gl.clearColor(...this.graph.background);

        this.setGlobalAmbientLight(...this.graph.ambient);

        this.initLights();
        this.initMaterials();
        this.initTextures();
        
        this.gameOrchestrator = new MyGameOrchestrator(this, this.gameboardPos);
        this.gameOrchestrator.startGame(1);

        this.sceneInited = true;
        this.initCameras();
        this.interface.addGUIelements(this.cameraIds[this.activeCamera]);
    }

    undo() {
        console.log("UNDO");
        this.gameOrchestrator.undo();
    }

    update(time) {
        if(this.sceneInited){
            for(var key in this.graph.animations) {
                this.graph.animations[key].update(time/1000);
            }

            for(var i = 0; i <  this.graph.spriteAnimations.length; ++i) {
                this.graph.spriteAnimations[i].update(time/1000);
            }

            this.gameOrchestrator.update(time);

            //console.log(this.cameraAnimation);
            if(this.cameraAnimation != null){
                let position = this.cameraAnimation.getInterpolatedPos(time);
                let target = this.cameraAnimation.getInterpolatedTarget(time);
                let near = this.cameraAnimation.getInterpolatedNear(time);
                let far = this.cameraAnimation.getInterpolatedFar(time);
                let angle = this.cameraAnimation.getInterpolatedAngle(time);
                if(position != null){
                    if(position != -1){
                        this.camera.updateCam(position, target, near, far, angle);
                    }
                    else{
                    }
                }
                else{
                    this.camera = this.nextCamera;
                    this.interface.setActiveCamera(this.camera);
                }
            }
        }
    }

    logPicking() {
		if (this.pickMode == false) {
			if (this.pickResults != null && this.pickResults.length > 0) {
				for (var i = 0; i < this.pickResults.length; i++) {
					var obj = this.pickResults[i][0];
					if (obj) {
						var customId = this.pickResults[i][1];
                        console.log("Picked object: " + obj + ", with pick id " + customId);
                        //this.gameOrchestrator.prolog.makeRequest("bruh");
					}
                }
                this.gameOrchestrator.managePick(this.pickResults);
				this.pickResults.splice(0, this.pickResults.length);
			}
		}
	}

    /**
     * Displays the scene.
     */
    display() {
        
        this.logPicking();
		this.clearPickRegistration();
        // ---- BEGIN Background, camera and axis setup

        // Clear image and depth buffer everytime we update the scene
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Initialize Model-View matrix as identity (no transformation
        this.updateProjectionMatrix();
        this.loadIdentity();

        // Apply transformations corresponding to the camera position relative to the origin
        this.applyViewMatrix();

        this.pushMatrix();

        for (var i = 0; i < this.lights.length; i++) {
            this.lights[i].setVisible(true);
            this.lights[i].enable();
        }

        if (this.sceneInited) {
            // Draw axis
            if(this.displayAxis)
                this.axis.display();

            if(this.displayNormals && !this.displayNormals_before) {
                this.graph.enableNormals();
                this.displayNormals_before = true;
            }
            else if(!this.displayNormals && this.displayNormals_before) {
                this.graph.disableNormals();
                this.displayNormals_before = false;
            }

            this.defaultAppearance.apply();
            
            // Updates the scene's lights
            this.updateLights();

            //this.testBoard.display();

            // Displays the scene (MySceneGraph function).
            this.graph.displayScene();
            this.gameOrchestrator.display();
            
        }
        else
        {
            // Show some "loading" visuals
            this.defaultAppearance.apply();

            this.rotate(-this.loadingProgress/10.0,0,0,1);
            
            this.loadingProgressObject.display();
            this.loadingProgress++;
        }

        this.popMatrix();
        // ---- END Background, camera and axis setup
    }
}