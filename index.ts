/// <reference path="../typings/index.d.ts" />

// Require PIXI
import PIXI = require('pixi.js');

// Define some aliases
let Container = PIXI.Container;
let Loader = PIXI.loader;
let Sprite = PIXI.Sprite;
let Resources = PIXI.loader.resources;
let Graphics = PIXI.Graphics;
let Text = PIXI.Text;
let Log = console.log;

const HALF_PI:number = Math.PI*0.5; // Turn sprite 90 degrees

// Globals (configurable consts)
// Colors
const COLOR_TITLE_FONT:number = 0xABDFDF; // white
const COLOR_BTN_GRN_SHDW:number = 0x228822; // dark green
const COLOR_BTN_GRN:number = 0x77AA77; // light green
const COLOR_BTN_TEXT:number = 0xDFDFDF; // white
const COLOR_SQ_EVEN:number = 0x66FF66; // light green
const COLOR_SQ_ODD:number = 0x4444AA; // dark blue
const COLOR_SHDW:number = 0x222222; // light black
const COLOR_BLACK:number = 0x000000; // black
const COLOR_EXIT:number = 0xAAFFAA; // light green
const COLOR_CYCLE:number = 0xFFAAAA; // light red
const COLOR_WALL:number = 0xBB7777; // red
const COLOR_MARKER:number = 0xAA9922; // orange
// Images
const URL_BACKGRND:string = "images/woodBkg.jpeg";
const URL_CHECKER:string = "images/bunny.jpeg";
const URL_GRASS:string = "images/grass256.jpeg";
const URL_MARBLE:string = "images/marble256.jpeg";
// Fonts
const FONT_TITLE:string = "Magneto";
const FONT_BUTTON:string = "Cooper Std Black";
const FONT_MARKER:string = "Arial";
// Strings
const STR_TITLE:string = "Amazing Checkerboard";
const STR_PLAY:string = "PLAY";
const STR_PAUSE:string = "PAUSE";
const STR_RESET_CHKR:string = "RESET CHECKER";
const STR_RESET_BRD:string = "RESET BOARD";
const STR_MARKER:string = "START";
// Numbers
const RENDERER_W:number = 1280; // Initial width
const RENDERER_H:number = 720 // Initial height
const TITLE_H:number = 30;
const SZ_FONT_TITLE:number = 28;
const SZ_FONT_BUTTON:number = 14;
const BUTTON_H:number = 80;
const BUTTON_W:number = 160;
const BUTTON_Y_OFFSET:number = 20;
const BUTTON_RAD:number = (BUTTON_H*0.5);
const GUI_W:number = (BUTTON_W*2);
const BUTTON_X:number = (GUI_W*0.5) - (BUTTON_W*0.5);
const SHADOW_PCT:number = 0.1; // Size of shadow as a % of object
const SHADOW_ALPHA:number = 0.3;
const SHADOW_ARROW_ALPHA:number = 0.6;

// Global (vars)
// Numbers
let g_numSquares:number = 8; // Start with an 8x8 board
let g_guiHeight:number = 0;
let g_guiXPos:number = 0;
let g_outerBoardSize:number = 0;
let g_squareSizePx:number = 0;
let g_currRow:number = 0;
let g_currCol:number = 0;
let g_currDir:number = 1;
let g_destX:number = 0;
let g_destY:number = 0;
// Booleans
let g_bMoving:boolean = false;
// Arrays
let g_Directions:Array<Array<number>> = new Array();
let g_Exits:Array<number> = new Array();
// Containers
let g_cGUI:PIXI.Container = new Container();
let g_cBoardOuter:PIXI.Container = new Container();
let g_cBoardInner:PIXI.Container = new Container();
let g_cChecker:PIXI.Container = new Container();
let g_cStartMarker:PIXI.Container = new Container();
// Variable function
let g_funcState:Function = pause;

///////////////////////////////////////////////////////////////////
// Create the renderer
const RENDERER:PIXI.WebGLRenderer = new PIXI.WebGLRenderer(RENDERER_W, RENDERER_H);
RENDERER.autoResize = true;
let View = RENDERER.view;
document.body.appendChild(View); // Add the renderer to the document

// Create the scene (stage)
const stage:PIXI.Container = new Container();

// Load the images we need
Loader
    .add([
        {url: URL_BACKGRND},
        {url: URL_CHECKER},
        {url: URL_GRASS},
        {url: URL_MARBLE}
    ])
    .load(setup)
    .on("progress", loaderProgress);

// After each image is loaded
function loaderProgress(loader, resource) {
    Log("Loaded: " + resource.url);
    Log("Loading Progress: " + loader.progress + "%");

    // If the background image has loaded, add it, then add other containers to the stage
    if(URL_BACKGRND == resource.url) {
        createSprite(URL_BACKGRND, 0, 0, View.width, View.height, false, stage);

        stage.addChild(g_cBoardOuter);
        g_cBoardOuter.addChild(g_cBoardInner); // Add the inner board to the outer board
        stage.addChild(g_cStartMarker);
        stage.addChild(g_cChecker);
    }
}

// After all images are loaded
function setup() {
    window.resizeTo(View.width, View.height);
    calcSizesAndPositions();

    setupGUI();

    setupTitle(STR_TITLE);

    setupBoard();

    createChecker();

    g_funcState = pause;

    // Start the main loop
    mainLoop();
}

// Recalculate on resize
function calcSizesAndPositions() {
    let boardMaxWidth:number = View.width - GUI_W;
    let boardMaxHeight:number = View.height - TITLE_H;
    g_outerBoardSize = Math.min(boardMaxWidth, boardMaxHeight);
    g_guiXPos = (View.width - g_outerBoardSize - GUI_W) / 2;

    repositionBoard();
}

function setupGUI() {
    let buttonYPos:number = 0;

    // Play
    createButton(BUTTON_X, buttonYPos, BUTTON_W, BUTTON_H,
        STR_PLAY, COLOR_BTN_GRN, COLOR_BTN_GRN_SHDW, COLOR_BTN_TEXT, onPlay, g_cGUI);
    buttonYPos += (BUTTON_H + BUTTON_Y_OFFSET);

    // Pause
    createButton(BUTTON_X, buttonYPos, BUTTON_W, BUTTON_H,
        STR_PAUSE, COLOR_BTN_GRN, COLOR_BTN_GRN_SHDW, COLOR_BTN_TEXT, onPause, g_cGUI);
    buttonYPos += (BUTTON_H + BUTTON_Y_OFFSET);

    // Reset checker
    createButton(BUTTON_X, buttonYPos, BUTTON_W, BUTTON_H,
        STR_RESET_CHKR, COLOR_BTN_GRN, COLOR_BTN_GRN_SHDW, COLOR_BTN_TEXT, onResetChecker, g_cGUI);
    buttonYPos += (BUTTON_H + BUTTON_Y_OFFSET);

    // Reset Board (and checker)
    createButton(BUTTON_X, buttonYPos, BUTTON_W, BUTTON_H,
        STR_RESET_BRD, COLOR_BTN_GRN, COLOR_BTN_GRN_SHDW, COLOR_BTN_TEXT, onResetBoard, g_cGUI);

    g_guiHeight = buttonYPos + BUTTON_H;

    repositionGUI();

    stage.addChild(g_cGUI);
}

function repositionGUI() {
    g_cGUI.position.set(g_guiXPos, TITLE_H + (g_outerBoardSize/2) - (g_guiHeight/2));
}

function repositionBoard() {
    // Position the board
    g_cBoardOuter.position.set(g_guiXPos + GUI_W, TITLE_H);
}

function createTriangle(x1, y1, x2, y2, x3, y3, color, alpha, container) {
    var newTriangle:PIXI.Graphics = new Graphics();
    newTriangle.beginFill(color);
    newTriangle.alpha = alpha;
    newTriangle.drawPolygon([
        x1, y1,
        x2, y2,
        x3, y3
    ]);
    newTriangle.endFill();
    container.addChild(newTriangle);
}

function createEquilateralTriangle(centerX, centerY, sideLength, color, alpha, container) {

    //createTriangle(x1, y1, x2, y2, x3, y3, color, alpha, container);
}

function createRectangle(xPos, yPos, width, height, rotation, color, alpha, container) {
    let newRect:PIXI.Graphics = new Graphics();
    newRect.beginFill(color);
    newRect.alpha = alpha;
    newRect.drawRect(0, 0, width, height);
    newRect.endFill();
    newRect.position.set(xPos, yPos);
    newRect.rotation += rotation;
    container.addChild(newRect);
    return newRect;
}

function createShadowedRectangle(xPos, yPos, width, height, rotation, color, shadowColor, shadowAlpha, shadowDistX, shadowDistY, container) {
    createRectangle(xPos+shadowDistX, yPos+shadowDistY, width, height, rotation, shadowColor, shadowAlpha, container);
    createRectangle(xPos, yPos, width, height, rotation, color, 1.0, container);
}

function createRoundedRectangle(xPos, yPos, width, height, cornerRad, color, alpha, container) {
    let newRoundRect:PIXI.Graphics = new Graphics();
    newRoundRect.beginFill(color);
    newRoundRect.alpha = alpha;
    newRoundRect.drawRoundedRect(0, 0, width, height, cornerRad);
    newRoundRect.endFill();
    newRoundRect.position.set(xPos, yPos);
    container.addChild(newRoundRect);
}

function createShadowedRoundedRectangle(xPos, yPos, width, height, cornerRad, color, shadowColor, shadowAlpha, shadowDistX, shadowDistY, container) {
    createRoundedRectangle(xPos+shadowDistX, yPos+shadowDistY, width, height, cornerRad, shadowColor, shadowAlpha, container);
    createRoundedRectangle(xPos, yPos, width, height, cornerRad, color, 1.0, container);
}

function createButton(xPos, yPos, width, height, text, color, shadowColor, textColor, onClickFunc, container) {
    // Create the button container
    let newButton:PIXI.Container = new Container();
    newButton.interactive = true;
    newButton.buttonMode = true;
    newButton.on('click', onClickFunc);

    // Create the shape of the button
    createShadowedRoundedRectangle(xPos, yPos, width, height, BUTTON_RAD, color, shadowColor, 1.0, 0, 5, newButton);

    // Position the text in the middle of the button
    let buttonMidX:number = xPos + (width/2);
    let buttonMidY:number = yPos + (height/2);
    createShadowedText(text, buttonMidX, buttonMidY, FONT_BUTTON, SZ_FONT_BUTTON, textColor, shadowColor, SHADOW_ALPHA, 1, 1, newButton);

    container.addChild(newButton);
}

// When Play button is pushed
function onPlay() {
    g_funcState = play;
}

// When Pause button is pushed
function onPause() {
    g_funcState = pause;
}

// When Reset Checker button is pushed
function onResetChecker() {
    onPause();
    randomizeCheckerPos();
}

// When Reset Board button is pushed
function onResetBoard() {
    // TODO: Get the number entered by user
    let userNum:number = 8;

    // TODO: If the user's number is valid, setup the board
    if(userNum > 1) {
        g_numSquares = userNum;
        onPause(); // Pause
        setupBoard(); // Setup a new board
        randomizeCheckerPos(); // Resize the checker and pick a new spot
    }
}

// Create the title
function setupTitle(text) {
    createShadowedText(text, (View.width/2), (TITLE_H/2), FONT_TITLE, SZ_FONT_TITLE, COLOR_TITLE_FONT, COLOR_SHDW, 1.0, 3, 3, stage);
}

// Create a sprite with exact size
function createSprite(url, xPos, yPos, sizeW, sizeH, centered, container) {
    let newSprite:PIXI.Sprite = new Sprite(Resources[url].texture);
    // Scale to exact sizeW and sizeH
    newSprite.scale.set((sizeW / newSprite.width), (sizeH / newSprite.height));
    if(centered)
        newSprite.anchor.set(0.5, 0.5); // Moves the texture centered over its pivot point
    newSprite.position.set(xPos, yPos);
    container.addChild(newSprite);
}

// Create some text
function createText(text, xPos, yPos, font, fontSize, fontColor, alpha, container) {
    let newText:PIXI.Text =
        new Text(text, {fontFamily: font, fontSize: fontSize, fill: fontColor});
    newText.alpha = alpha;
    newText.position.set(xPos - newText.width/2, yPos - newText.height/2);
    container.addChild(newText);
}

// Create a shadow layer of text under normal text
function createShadowedText(text, xPos, yPos, font, fontSize, fontColor, shadowColor, shadowAlpha, shadowDistX, shadowDistY, container) {
    // Create the shadow text first
    createText(text, xPos+shadowDistX, yPos+shadowDistY, font, fontSize, shadowColor, shadowAlpha, container);
    createText(text, xPos, yPos, font, fontSize, fontColor, 1.0, container);
}

function setupBoard() {
    // Remove everything previously on the board
    g_cBoardInner.removeChildren();

    // Setup new random directions
    randomizeDirections();

    /* Algorithm to determine which squares will lead to exits
    vs. which will lead to cycles */
    calculateExits();

    // Position the inner board container
    let innerOuterRatio:number = g_numSquares/(g_numSquares+2);
    let innerBoardSize:number = innerOuterRatio*g_outerBoardSize;
    let boardInnerOuterOffset:number = (g_outerBoardSize - innerBoardSize) / 2;
    g_cBoardInner.position.set(boardInnerOuterOffset, boardInnerOuterOffset);

    // Set the new square size
    g_squareSizePx = innerBoardSize / g_numSquares;

    // Draw the squares
    drawSquares();

    // Draw arrows on top of squares
    drawArrows();
}

function drawSquares() {
    // Draw odd ones first
    for (let i:number = 0; i < g_numSquares; i++) {
        for (let j:number = 0; j < g_numSquares; j++) {
            if((i+j) % 2) {
                //drawColoredSquare(i, j);
                drawTextureSquare(i, j);
            }
        }
    }
    // Draw shadows so they will shade the odd ones from the even ones
    for (let i:number = 0; i < g_numSquares; i++) {
        for (let j:number = 0; j < g_numSquares; j++) {
            if(0 == (i+j) % 2) {
                drawShadowOfSquare(i, j);
            }
        }
    }
    // Draw even ones on top of shadows
    for (let i:number = 0; i < g_numSquares; i++) {
        for (let j:number = 0; j < g_numSquares; j++) {
            if(0 == (i+j) % 2) {
                //drawColoredSquare(i, j);
                drawTextureSquare(i, j);
            }
        }
    }

    // Draw the walls on top of squares
    drawWalls();
}

// Draw a wall at the desired square and in the desired direction
function drawColoredWall(row, col, dir) {
    let wallWidth:number = (g_squareSizePx*0.1);
    let halfWallW:number = (wallWidth*0.5);
    let wallLength:number = (g_squareSizePx+wallWidth);
    let xPos:number = (col*g_squareSizePx);
    let yPos:number = (row*g_squareSizePx);

    // Get the rectangle returned
    let newWall:PIXI.Graphics = createRectangle(xPos, yPos, wallLength, wallWidth, 0.0, COLOR_WALL, 1.0, g_cBoardInner);

    // Rotate and/or move the wall
    switch(dir) {
    case 1: // Up
        newWall.position.set((xPos-halfWallW), (yPos-halfWallW));
        break;
    case 2: // Right
        newWall.rotation += HALF_PI;
        newWall.position.set((xPos+g_squareSizePx+halfWallW), (yPos-halfWallW));
        break;
    case 3: // Bottom
        newWall.position.set((xPos-halfWallW), (yPos+g_squareSizePx-halfWallW));
        break;
    case 4: // Left
        newWall.rotation += HALF_PI;
        newWall.position.set((xPos+halfWallW), (yPos-halfWallW));
        break;
    }
}

// Draw a light or dark color square depending on the position
function drawColoredSquare(row, col) {
    let xPos:number = (col*g_squareSizePx);
    let yPos:number = (row*g_squareSizePx);
    let squareColor:number = COLOR_SQ_EVEN; // Even color
    if((row+col) % 2) {
        squareColor = COLOR_SQ_ODD; // Odd color
    }
    createRectangle(xPos, yPos, g_squareSizePx, g_squareSizePx, 0.0, squareColor, 1.0, g_cBoardInner);
}

// Draw a square with one of two textures depending on position
function drawTextureSquare(row, col) {
    let xPos:number = (col*g_squareSizePx);
    let yPos:number = (row*g_squareSizePx);
    let textureURL:string = URL_MARBLE; // Marble on evens
    if((row+col) % 2) {
        textureURL = URL_GRASS; // Grass on odds
    }
    createSprite(textureURL, xPos, yPos, g_squareSizePx, g_squareSizePx, false, g_cBoardInner);
}

// Draw a shadow at the desired square
function drawShadowOfSquare(row, col) {
    let origXPos:number = (col*g_squareSizePx);
    let origYPos:number = (row*g_squareSizePx);
    let shadowPx:number = (g_squareSizePx*SHADOW_PCT);
    let shadowXPos:number = origXPos + shadowPx;
    let shadowYPos:number = origYPos + shadowPx;

    // Draw the square's shadow
    createRectangle(shadowXPos, shadowYPos, g_squareSizePx, g_squareSizePx, 0.0, COLOR_SHDW, SHADOW_ALPHA, g_cBoardInner);

    // Draw connecting triangle shadow (upper right)
    createTriangle(
        (origXPos+g_squareSizePx), origYPos,
        (origXPos+g_squareSizePx), shadowYPos,
        (shadowXPos+g_squareSizePx), shadowYPos,
        COLOR_SHDW, SHADOW_ALPHA, g_cBoardInner);

    // Draw connecting triangle shadow (lower left)
    createTriangle(
        origXPos, (origYPos+g_squareSizePx),
        shadowXPos, (origYPos+g_squareSizePx),
        shadowXPos, (shadowYPos+g_squareSizePx),
        COLOR_SHDW, SHADOW_ALPHA, g_cBoardInner);
}

// Setup random direction for each square on the board
function randomizeDirections() {
    // Get the previous size so we can deallocate/allocate memory as needed
    let prevNumSquares:number = g_Directions.length;
    let larger:number = Math.max(prevNumSquares, g_numSquares);

    // Go through to the larger number so we can allocate/deallocate memory
    for (let i:number = 0; i < larger; i++) {
        // If there are too many rows, remove the bottom ones
        if (i > g_numSquares-1) {
            g_Directions.pop();
            continue;
        }
        // If there are not enough rows, allocate a new row
        if(i > prevNumSquares-1) {
            g_Directions[i] = new Array(g_numSquares);
        }

        // Get a random direction for each square
        for (let j:number = 0; j < larger; j++) {
            // If there are too many columns, remove the end ones
            if (j > g_numSquares-1) {
                g_Directions.pop();
                continue;
            }
            // If there are not enough columns, push a newone
            if(j > prevNumSquares-1) {
                g_Directions[i].push(1);
            }

            g_Directions[i][j] = randomInt(1, 4);
        }
    }
}

/* Algoritm to find all of the squares which lead to exits off the board.
All others are presumed to lead to cycles. */
function calculateExits() {
    // Clear the list of exits
    let numExits:number = g_Exits.length;
    for(let i:number = 0; i < numExits; i++)
        g_Exits.pop();

    // Make sure exits is empty
    Log("# Exits after emptied: " + g_Exits.length);

    // Top row of board
    for (let j:number = 0; j < g_numSquares; j++) {
        // If its pointing up, its an exit
        if(1 == g_Directions[0][j]) {
            g_Exits.push(j); // Put this square in the exits array
        }
    }
    // Bottom row of board
    let bottomRowIdx:number = (g_numSquares-1);
    let bottomLeftSquareIdx:number = (bottomRowIdx*g_numSquares);
    for (let j:number = 0; j < g_numSquares; j++) {
        // If its pointing down, its an exit
        if(3 == g_Directions[bottomRowIdx][j]) {
            g_Exits.push(bottomLeftSquareIdx + j); // Put this square in the exits array
        }
    }
    // Left column of board
    for (let i:number = 0; i < g_numSquares; i++) {
        // If its pointing left, its an exit
        if(4 == g_Directions[i][0]) {
            g_Exits.push(i*g_numSquares); // Put this square in the exits array
        }
    }
    // Right column of board
    let rightColumnIdx:number = (g_numSquares-1);
    for (let i:number = 0; i < g_numSquares; i++) {
        // If its pointing right, its an exit
        if(2 == g_Directions[i][rightColumnIdx]) {
            g_Exits.push((i*g_numSquares) + rightColumnIdx); // Put this square in the exits array
        }
    }

    // Now we know the number of exits
    Log("# Exits off the board: " + g_Exits.length);

    // Now step through the exits array, and continually add any squares which point to exits
    for(let i:number = 0; i < g_Exits.length; i++) {
        let squareIdx:number = g_Exits[i];
        let rowIdx:number = Math.floor(squareIdx/g_numSquares); // Get the row of this square
        let colIdx:number = squareIdx % g_numSquares; // Get the column of this square

        // Check the square above. If its pointing down, add it
        if(rowIdx-1 >= 0) {
            if(3 == g_Directions[rowIdx-1][colIdx]) {
                g_Exits.push(((rowIdx-1)*g_numSquares) + colIdx);
            }
        }
        // Check the square below. If its pointing up, add it
        if(rowIdx+1 < g_numSquares) {
            if(1 == g_Directions[rowIdx+1][colIdx]) {
                g_Exits.push(((rowIdx+1)*g_numSquares) + colIdx);
            }
        }
        // Check the square to the left. If its pointing right, add it
        if(colIdx-1 >= 0) {
            if(2 == g_Directions[rowIdx][colIdx-1]) {
                g_Exits.push((rowIdx*g_numSquares) + (colIdx-1));
            }
        }
        // Check the square to the right. If its pointing left, add it
        if(colIdx+1 < g_numSquares) {
            if(4 == g_Directions[rowIdx][colIdx+1]) {
                g_Exits.push((rowIdx*g_numSquares) + (colIdx+1));
            }
        }
    }

    // Now we know the number of squares that lead to exits
    Log("# Squares leading to exits: " + g_Exits.length);

    g_Exits.sort();
}

/* Algorithm to determine if squares have a path to/from each side.
If a side has no path in or out, then place a wall on that side. */
function drawWalls() {
    // Go to each square
    for (let i:number = 0; i < g_numSquares; i++) {
        for (let j:number = 0; j < g_numSquares; j++) {
            let squareDir:number = g_Directions[i][j];

            // If this square isn't pointing up
            if(1 != squareDir) {
                // Check the square above. If its not pointing down, add a wall
                if(i-1 >= 0) {
                    if(3 != g_Directions[i-1][j])
                        drawColoredWall(i, j, 1);
                }
                else
                    drawColoredWall(i, j, 1); // Edge of board
            }

            // If this square isn't pointing down
            if(3 != squareDir) {
                // Check the square below. If its not pointing up, add a wall
                if(i+1 < g_numSquares) {
                    if(1 != g_Directions[i+1][j])
                        drawColoredWall(i, j, 3);
                }
                else
                    drawColoredWall(i, j, 3); // Edge of board
            }

            // If this square isn't pointing left
            if(4 != squareDir) {
                // Check the square to the left. If its not pointing right, add a wall
                if(j-1 >= 0) {
                    if(2 != g_Directions[i][j-1])
                        drawColoredWall(i, j, 4);
                }
                else
                    drawColoredWall(i, j, 4); // Edge of board
            }

            // If this square isn't pointing right
            if(2 != squareDir) {
                // Check the square to the right. If its not pointing left, add a wall
                if(j+1 < g_numSquares) {
                    if(4 != g_Directions[i][j+1])
                        drawColoredWall(i, j, 2);
                }
                else
                    drawColoredWall(i, j, 2); // Edge of board
            }
        }
    }
}

// Draw colored triangles inside of the squares to mark directions
function drawArrows() {
    // Calculate triangle sizes
    let triangleEdge:number = (g_squareSizePx*0.3); // Triangle side is 30% of the square size
    let xEdge:number = (triangleEdge*0.5);
    let yEdge:number = Math.sqrt(triangleEdge*triangleEdge - xEdge*xEdge); // b = sqrt(c^2 - a^2)
    let xRatio:number = (xEdge/triangleEdge);
    let yRatio:number = (yEdge/triangleEdge);
    let shadowPix:number = ((g_squareSizePx*SHADOW_PCT)*0.5); // smaller shadow %
    let shadowX:number = (shadowPix*xRatio);
    let shadowY:number = (shadowPix*yRatio);

    for (let i:number = 0; i < g_numSquares; i++) {
        for (let j:number = 0; j < g_numSquares; j++) {
            // Add arrow container - pivot from the center of the square
            let newArrow:PIXI.Container = new Container();
            newArrow.position.set(j*g_squareSizePx + g_squareSizePx/2, i*g_squareSizePx + g_squareSizePx/2);

            // Determine if this is a cycle or an exit
            let triangleColor:number = COLOR_CYCLE;
            if(-1 != g_Exits.indexOf((i*g_numSquares) + j))
                triangleColor = COLOR_EXIT;

            // Draw background triangle
            createTriangle(
                -xEdge, -xEdge, // left
                0, (-yEdge-xEdge), // top
                xEdge, -xEdge, // right
                triangleColor, 1.0, newArrow);

            // Draw shadow over entire triangle
            createTriangle(
                -xEdge, -xEdge, // left
                0, (-yEdge-xEdge), // top
                xEdge, -xEdge, // right
                COLOR_SHDW, SHADOW_ARROW_ALPHA, newArrow);

            // Draw unshaded triangle over shadow
            createTriangle(
                (-xEdge+shadowY), (-shadowX-xEdge), // left
                0, (-yEdge+shadowY-xEdge), // top
                (xEdge-(shadowY)), (-shadowX-xEdge), // right
                triangleColor, 1.0, newArrow);

            // Rotate the arrow in the correct direction
            newArrow.rotation += (HALF_PI*(g_Directions[i][j]-1)); // Rotate right, down or left

            g_cBoardInner.addChild(newArrow);
        }
    }
}

// Create the checker and start marker
function createChecker() {
    // Mark where the checker starts
    createShadowedText(STR_MARKER, 0, 0, FONT_MARKER, (g_squareSizePx/8), COLOR_MARKER, COLOR_BLACK, 1.0, 1, 1, g_cStartMarker);

    // Create the checker
    createSprite(URL_CHECKER, 0, 0, (g_squareSizePx*0.5), (g_squareSizePx*0.5), true, g_cChecker);

    // Position the marker and the checker
    randomizeCheckerPos();
}

// Generate a random starting position for the checker
function randomizeCheckerPos() {
    g_bMoving = false;
    setCheckerPos(randomInt(0, g_numSquares-1), randomInt(0, g_numSquares-1));
}

// Set the starting position for the checker
function setCheckerPos(row, col) {
    g_currRow = row;
    g_currCol = col;

    // Calculate the global position of the new row and column
    let checkerXPos:number = g_cBoardInner.getGlobalPosition().x + (g_squareSizePx*g_currCol) + (g_squareSizePx*0.5);
    let checkerYPos:number = g_cBoardInner.getGlobalPosition().y + (g_squareSizePx*g_currRow) + (g_squareSizePx*0.5);

    // Position the start marker over the new board position
    g_cStartMarker.position.x = checkerXPos;
    g_cStartMarker.position.y = checkerYPos;

    // Position the checker over the new board position
    g_cChecker.position.x = checkerXPos;
    g_cChecker.position.y = checkerYPos;

    turnChecker();
}

// The main render loop
function mainLoop() {
    // Start the timer for the next animation loop
    requestAnimationFrame(mainLoop);

    // Update for the current state
    g_funcState(); // variable function (play/pause)

    // Render the scene
    RENDERER.render(stage);
}

// Update position of checker
function play() {
    updateChecker();
}

// Pause - do nothing
function pause() {
}

// Turns and sets destination of checker, then moves the checker
function updateChecker() {
    // If not moving, then change direction and get the desired destination
    if(!g_bMoving) {
        // If we've gone off the board, set state to pause, and don't move anymore
        if(g_currCol < 0 || g_currCol >= g_numSquares ||
            g_currRow < 0 || g_currRow >= g_numSquares) {
              g_funcState = pause;
              return;
        }
        turnChecker();
        nextSquare();
    }
    else {
        moveStep(1);
    }
}

// Turn the checker in the direction that the current square points
function turnChecker() {
    // Get a relative turn (left or right)
    let prevDir:number = g_currDir;
    g_currDir = g_Directions[g_currRow][g_currCol];
    let turnLeftRight:number = ((g_currDir - prevDir) + 4) % 4; // 0 - 3
    if(turnLeftRight > 2)
      turnLeftRight -= 4;
    // Turn 90 degrees * number of turns
    g_cChecker.rotation += (HALF_PI*turnLeftRight);
}

// Set the next destination square for the checker based on the current direction
function nextSquare() {
    let x:number = g_cChecker.position.x;
    let y:number = g_cChecker.position.y;

    switch (g_currDir) {
    case 1: // Up
        g_currRow--;
        setDestination(x, y - g_squareSizePx);
        break;
    case 2: // Right
        g_currCol++;
        setDestination(x + g_squareSizePx, y);
        break;
    case 3: // Down
        g_currRow++;
        setDestination(x, y + g_squareSizePx);
        break;
    case 4: // Left
        g_currCol--;
        setDestination(x - g_squareSizePx, y);
        break;
    }
}

// Set a new destination x/y for the checker, and start moving
function setDestination(x, y) {
    g_bMoving = true;
    g_destX = x;
    g_destY = y;
}

// Move the checker in its current direction
function moveStep(speed) {
    switch (g_currDir) {
    case 1: // Up
        moveUp(speed);
        break;
    case 2: // Right
        moveRight(speed);
        break;
    case 3: // Down
        moveDown(speed);
        break;
    case 4: // Left
        moveLeft(speed);
        break;
    }
    /* If we reached the current destination, set moving to false
    then a new destination can potentially be found */
    if(g_cChecker.position.x == g_destX && g_cChecker.position.y == g_destY) {
        g_bMoving = false;
    }
}

// Move the checker left, but not past its destination
function moveLeft(pix) {
    pix = Math.min(pix, Math.abs(g_destX - g_cChecker.position.x));
    moveX(-pix);
}

// Move the checker right, but not past its destination
function moveRight(pix) {
    pix = Math.min(pix, Math.abs(g_destX - g_cChecker.position.x));
    moveX(pix);
}

// Move the checker up, but not past its destination
function moveUp(pix) {
    pix = Math.min(pix, Math.abs(g_destY - g_cChecker.position.y));
    moveY(-pix);
}

// Move the checker down, but not past its destination
function moveDown(pix) {
    pix = Math.min(pix, Math.abs(g_destY - g_cChecker.position.y));
    moveY(pix);
}

// Move the checker in the x direction
function moveX(pix) {
    g_cChecker.position.x += pix;
}

// Move the checker in the y direction
function moveY(pix) {
    g_cChecker.position.y += pix;
}

// Get a random integer between min and max (incusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
