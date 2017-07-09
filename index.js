(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jiboProgrammingChallenge = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="../typings/index.d.ts" />
"use strict";
// Require PIXI
var PIXI = require('pixi.js');
// Define some aliases
var Container = PIXI.Container;
var Loader = PIXI.loader;
var Sprite = PIXI.Sprite;
var Resources = PIXI.loader.resources;
var Graphics = PIXI.Graphics;
var Text = PIXI.Text;
var Log = console.log;
var HALF_PI = Math.PI * 0.5; // Turn sprite 90 degrees
// Globals (configurable consts)
var RENDERER_W = 1280; // Initial width
var RENDERER_H = 720; // Initial height
var COLOR_TITLE_FONT = 0xABDFDF; // white
var COLOR_BTN_GRN_SHDW = 0x228822; // dark green
var COLOR_BTN_GRN = 0x77AA77; // light green
var COLOR_BTN_TEXT = 0xDFDFDF; // white
var COLOR_SQ_EVEN = 0x66FF66; // light green
var COLOR_SQ_ODD = 0x4444AA; // dark blue
var COLOR_SHDW = 0x222211; // dark black
var COLOR_EXIT = 0xAAFFAA; // light green
var COLOR_CYCLE = 0xFFAAAA; // light red
var COLOR_WALL = 0xBB7777; // red
var URL_BACKGRND = "images/woodBkg.jpeg";
var URL_CHECKER = "images/bunny.jpeg";
var URL_GRASS = "images/grass256.jpeg";
var URL_MARBLE = "images/marble256.jpeg";
var FONT_TITLE = "Magneto"; // font
var FONT_BUTTON = "Cooper Std Black"; // font
var TITLE_H = 30;
var SZ_FONT_TITLE = 28;
var SZ_FONT_BUTTON = 14;
var BUTTON_H = 80;
var BUTTON_W = 160;
var BUTTON_Y_OFFSET = 20;
var BUTTON_RAD = (BUTTON_H * 0.5);
var GUI_W = (BUTTON_W * 2);
var BUTTON_X = (GUI_W * 0.5) - (BUTTON_W * 0.5);
var SHADOW_PCT = 0.1;
var SHADOW_ALPHA = 0.3;
var SHADOW_ARROW_ALPHA = 0.8;
// Global (vars)
var g_numSquares = 8; // Start with an 8x8 board
var g_guiHeight = 0;
var g_guiXPos = 0;
var outerBoardSize = 0;
var squareSizePx = 0;
var currRow = 0;
var currCol = 0;
var prevDir = 1;
var currDir = 1;
var destX = 0;
var destY = 0;
var moving = false;
var state = pause;
var directions = new Array();
var exits = new Array();
var gui = new Container();
var boardOuter = new Container();
var boardInner = new Container();
var checker = new Container();
var startMarker = new Container();
// Create the renderer
var renderer = new PIXI.WebGLRenderer(RENDERER_W, RENDERER_H);
renderer.autoResize = true;
var View = renderer.view;
document.body.appendChild(View); // Add the renderer to the document
// Create the scene (stage)
var stage = new Container();
// Load the images we need
Loader
    .add([
    { url: URL_BACKGRND },
    { url: URL_CHECKER },
    { url: URL_GRASS },
    { url: URL_MARBLE }
])
    .load(setup)
    .on("progress", loaderProgress);
// After each image is loaded
function loaderProgress(loader, resource) {
    Log("Loaded: " + resource.url);
    Log("Loading Progress: " + loader.progress + "%");
    // If the background image has loaded, add it, then add other containers to the stage
    if (URL_BACKGRND == resource.url) {
        createSprite(URL_BACKGRND, 0, 0, View.width, View.height, false, stage);
        stage.addChild(boardOuter);
        boardOuter.addChild(boardInner); // Add the inner board to the outer board
        stage.addChild(startMarker);
        stage.addChild(checker);
    }
}
// After all images are loaded
function setup() {
    window.resizeTo(View.width, View.height);
    calcSizesAndPositions();
    setupGUI();
    setupTitle("Amazing Checkerboard");
    setupBoard();
    setupChecker();
    state = pause;
    // Start the main loop
    mainLoop();
}
// Recalculate on resize
function calcSizesAndPositions() {
    var boardMaxWidth = View.width - GUI_W;
    var boardMaxHeight = View.height - TITLE_H;
    outerBoardSize = Math.min(boardMaxWidth, boardMaxHeight);
    g_guiXPos = (View.width - outerBoardSize - GUI_W) / 2;
    repositionBoard();
}
function setupGUI() {
    var buttonYPos = 0;
    // Play
    createButton(BUTTON_X, buttonYPos, BUTTON_W, BUTTON_H, "PLAY", COLOR_BTN_GRN, COLOR_BTN_GRN_SHDW, COLOR_BTN_TEXT, onPlay, gui);
    buttonYPos += (BUTTON_H + BUTTON_Y_OFFSET);
    // Pause
    createButton(BUTTON_X, buttonYPos, BUTTON_W, BUTTON_H, "PAUSE", COLOR_BTN_GRN, COLOR_BTN_GRN_SHDW, COLOR_BTN_TEXT, onPause, gui);
    buttonYPos += (BUTTON_H + BUTTON_Y_OFFSET);
    // Reset checker
    createButton(BUTTON_X, buttonYPos, BUTTON_W, BUTTON_H, "RESET CHECKER", COLOR_BTN_GRN, COLOR_BTN_GRN_SHDW, COLOR_BTN_TEXT, onResetChecker, gui);
    buttonYPos += (BUTTON_H + BUTTON_Y_OFFSET);
    // Reset Board (and checker)
    createButton(BUTTON_X, buttonYPos, BUTTON_W, BUTTON_H, "RESET BOARD", COLOR_BTN_GRN, COLOR_BTN_GRN_SHDW, COLOR_BTN_TEXT, onResetBoard, gui);
    g_guiHeight = buttonYPos + BUTTON_H;
    repositionGUI();
    stage.addChild(gui);
}
function repositionGUI() {
    gui.position.set(g_guiXPos, TITLE_H + (outerBoardSize / 2) - (g_guiHeight / 2));
}
function repositionBoard() {
    // Position the board
    boardOuter.position.set(g_guiXPos + GUI_W, TITLE_H);
}
function createTriangle(x1, y1, x2, y2, x3, y3, color, alpha, container) {
    var newTriangle = new Graphics();
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
    var newRect = new Graphics();
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
    createRectangle(xPos + shadowDistX, yPos + shadowDistY, width, height, rotation, shadowColor, shadowAlpha, container);
    createRectangle(xPos, yPos, width, height, rotation, color, 1.0, container);
}
function createRoundedRectangle(xPos, yPos, width, height, cornerRad, color, alpha, container) {
    var newRoundRect = new Graphics();
    newRoundRect.beginFill(color);
    newRoundRect.alpha = alpha;
    newRoundRect.drawRoundedRect(0, 0, width, height, cornerRad);
    newRoundRect.endFill();
    newRoundRect.position.set(xPos, yPos);
    container.addChild(newRoundRect);
}
function createShadowedRoundedRectangle(xPos, yPos, width, height, cornerRad, color, shadowColor, shadowAlpha, shadowDistX, shadowDistY, container) {
    createRoundedRectangle(xPos + shadowDistX, yPos + shadowDistY, width, height, cornerRad, shadowColor, shadowAlpha, container);
    createRoundedRectangle(xPos, yPos, width, height, cornerRad, color, 1.0, container);
}
function createButton(xPos, yPos, width, height, text, color, shadowColor, textColor, onClickFunc, container) {
    // Create the button container
    var newButton = new Container();
    newButton.interactive = true;
    newButton.buttonMode = true;
    newButton.on('click', onClickFunc);
    // Create the shape of the button
    createShadowedRoundedRectangle(xPos, yPos, width, height, BUTTON_RAD, color, shadowColor, 1.0, 0, 5, newButton);
    // Position the text in the middle of the button
    var buttonMidX = xPos + (width / 2);
    var buttonMidY = yPos + (height / 2);
    createShadowedText(text, buttonMidX, buttonMidY, FONT_BUTTON, SZ_FONT_BUTTON, textColor, shadowColor, SHADOW_ALPHA, 1, 1, newButton);
    container.addChild(newButton);
}
// When Play button is pushed
function onPlay() {
    state = play;
}
// When Pause button is pushed
function onPause() {
    state = pause;
}
// When Reset Checker button is pushed
function onResetChecker() {
    onPause();
    randomizeCheckerPos();
}
// When Reset Board button is pushed
function onResetBoard() {
    // TODO: Get the number entered by user
    var userNum = 8;
    // TODO: If the user's number is valid, setup the board
    if (userNum > 1) {
        g_numSquares = userNum;
        onPause(); // Pause
        setupBoard(); // Setup a new board
        randomizeCheckerPos(); // Resize the checker and pick a new spot
    }
}
// Create the title
function setupTitle(text) {
    createShadowedText(text, (View.width / 2), (TITLE_H / 2), FONT_TITLE, SZ_FONT_TITLE, COLOR_TITLE_FONT, COLOR_SHDW, 1.0, 3, 3, stage);
}
// Create a sprite with exact size
function createSprite(url, xPos, yPos, sizeW, sizeH, centered, container) {
    var newSprite = new Sprite(Resources[url].texture);
    // Scale to exact sizeW and sizeH
    newSprite.scale.set((sizeW / newSprite.width), (sizeH / newSprite.height));
    if (centered)
        newSprite.anchor.set(0.5, 0.5); // Moves the texture centered over its pivot point
    newSprite.position.set(xPos, yPos);
    container.addChild(newSprite);
}
// Create some text
function createText(text, xPos, yPos, font, fontSize, fontColor, alpha, container) {
    var newText = new Text(text, { fontFamily: font, fontSize: fontSize, fill: fontColor });
    newText.alpha = alpha;
    newText.position.set(xPos - newText.width / 2, yPos - newText.height / 2);
    container.addChild(newText);
}
// Create a shadow layer of text under normal text
function createShadowedText(text, xPos, yPos, font, fontSize, fontColor, shadowColor, shadowAlpha, shadowDistX, shadowDistY, container) {
    // Create the shadow text first
    createText(text, xPos + shadowDistX, yPos + shadowDistY, font, fontSize, shadowColor, shadowAlpha, container);
    createText(text, xPos, yPos, font, fontSize, fontColor, 1.0, container);
}
function setupBoard() {
    // Remove everything previously on the board
    boardInner.removeChildren();
    // Setup new random directions
    randomizeDirections();
    /* Algorithm to determine which squares will lead to exits
    vs. which will lead to cycles */
    calculateExits();
    // Position the inner board container
    var innerOuterRatio = g_numSquares / (g_numSquares + 2);
    var innerBoardSize = innerOuterRatio * outerBoardSize;
    var boardInnerOuterOffset = (outerBoardSize - innerBoardSize) / 2;
    boardInner.position.set(boardInnerOuterOffset, boardInnerOuterOffset);
    // Set the new square size
    squareSizePx = innerBoardSize / g_numSquares;
    // Draw the squares
    drawSquares();
    // Draw arrows on top of squares
    drawArrows();
}
function drawSquares() {
    // Draw odd ones first
    for (var i = 0; i < g_numSquares; i++) {
        for (var j = 0; j < g_numSquares; j++) {
            if ((i + j) % 2) {
                //drawColoredSquare(i, j);
                drawTextureSquare(i, j);
            }
        }
    }
    // Draw shadows so they will shade the odd ones from the even ones
    for (var i = 0; i < g_numSquares; i++) {
        for (var j = 0; j < g_numSquares; j++) {
            if (0 == (i + j) % 2) {
                drawShadowOfSquare(i, j);
            }
        }
    }
    // Draw even ones on top of shadows
    for (var i = 0; i < g_numSquares; i++) {
        for (var j = 0; j < g_numSquares; j++) {
            if (0 == (i + j) % 2) {
                //drawColoredSquare(i, j);
                drawTextureSquare(i, j);
            }
        }
    }
    // Draw the walls on top of squares
    drawWalls();
}
function drawColoredWall(row, col, dir) {
    var wallWidth = (squareSizePx * 0.1);
    var halfWallW = (wallWidth * 0.5);
    var wallLength = (squareSizePx + wallWidth);
    var xPos = (col * squareSizePx);
    var yPos = (row * squareSizePx);
    var wall = createRectangle(xPos, yPos, wallLength, wallWidth, 0.0, COLOR_WALL, 1.0, boardInner);
    // Rotate and/or move the wall
    switch (dir) {
        case 1:
            wall.position.set((xPos - halfWallW), (yPos - halfWallW));
            break;
        case 2:
            wall.rotation += HALF_PI;
            wall.position.set((xPos + squareSizePx + halfWallW), (yPos - halfWallW));
            break;
        case 3:
            wall.position.set((xPos - halfWallW), (yPos + squareSizePx - halfWallW));
            break;
        case 4:
            wall.rotation += HALF_PI;
            wall.position.set((xPos + halfWallW), (yPos - halfWallW));
            break;
    }
}
// Draw a light or dark color square depending on the position
function drawColoredSquare(row, col) {
    var xPos = (col * squareSizePx);
    var yPos = (row * squareSizePx);
    var squareColor = COLOR_SQ_EVEN; // Even color
    if ((row + col) % 2) {
        squareColor = COLOR_SQ_ODD; // Odd color
    }
    createRectangle(xPos, yPos, squareSizePx, squareSizePx, 0.0, squareColor, 1.0, boardInner);
}
// Draw a square with one of two textures depending on position
function drawTextureSquare(row, col) {
    var xPos = (col * squareSizePx);
    var yPos = (row * squareSizePx);
    var textureURL = URL_MARBLE; // Marble on evens
    if ((row + col) % 2) {
        textureURL = URL_GRASS; // Grass on odds
    }
    createSprite(textureURL, xPos, yPos, squareSizePx, squareSizePx, false, boardInner);
}
// Draw a shadow at the desired square
function drawShadowOfSquare(row, col) {
    var origXPos = (col * squareSizePx);
    var origYPos = (row * squareSizePx);
    var shadowPx = (squareSizePx * SHADOW_PCT);
    var shadowXPos = origXPos + shadowPx;
    var shadowYPos = origYPos + shadowPx;
    // Draw the square's shadow
    createRectangle(shadowXPos, shadowYPos, squareSizePx, squareSizePx, 0.0, COLOR_SHDW, SHADOW_ALPHA, boardInner);
    // Draw connecting triangle shadow (upper right)
    createTriangle((origXPos + squareSizePx), origYPos, (origXPos + squareSizePx), shadowYPos, (shadowXPos + squareSizePx), shadowYPos, COLOR_SHDW, SHADOW_ALPHA, boardInner);
    // Draw connecting triangle shadow (lower left)
    createTriangle(origXPos, (origYPos + squareSizePx), shadowXPos, (origYPos + squareSizePx), shadowXPos, (shadowYPos + squareSizePx), COLOR_SHDW, SHADOW_ALPHA, boardInner);
}
// Setup random direction for each square on the board
function randomizeDirections() {
    // Get the previous size so we can deallocate/allocate memory as needed
    var prevNumSquares = directions.length;
    var larger = Math.max(prevNumSquares, g_numSquares);
    // Go through to the larger number so we can allocate/deallocate memory
    for (var i = 0; i < larger; i++) {
        // If there are too many rows, remove the bottom one
        if (i > g_numSquares - 1) {
            directions.pop();
            continue;
        }
        // If there are not enough rows, allocate a new row
        if (i > prevNumSquares - 1) {
            directions[i] = new Array(g_numSquares);
        }
        // Get a random direction for each square
        for (var j = 0; j < g_numSquares; j++) {
            directions[i][j] = randomInt(1, 4);
        }
    }
}
function calculateExits() {
    // Clear the list of exits
    var numExits = exits.length;
    for (var i = 0; i < numExits; i++)
        exits.pop();
    // Top row
    for (var j = 0; j < g_numSquares; j++) {
        // If its pointing up, its an exit
        if (1 == directions[0][j]) {
            exits.push(j); // Put this square in the exits array
        }
    }
    // Bottom row
    for (var j = 0; j < g_numSquares; j++) {
        // If its pointing down, its an exit
        if (3 == directions[g_numSquares - 1][j]) {
            exits.push(((g_numSquares - 1) * g_numSquares) + j); // Put this square in the exits array
        }
    }
    // Left column
    for (var i = 0; i < g_numSquares; i++) {
        // If its pointing left, its an exit
        if (4 == directions[i][0]) {
            exits.push(i * g_numSquares); // Put this square in the exits array
        }
    }
    // Right column
    for (var i = 0; i < g_numSquares; i++) {
        // If its pointing right, its an exit
        if (2 == directions[i][g_numSquares - 1]) {
            exits.push((i * g_numSquares) + (g_numSquares - 1)); // Put this square in the exits array
        }
    }
    // Now we know the number of exits
    // Now step through the exits array, and continually add any squares which point to exits
    for (var i = 0; i < exits.length; i++) {
        var squareIdx = exits[i];
        var rowIdx = Math.floor(squareIdx / g_numSquares); // Get the row of this square
        var colIdx = squareIdx % g_numSquares; // Get the column of this square
        // Check the square above. If its pointing down, add it
        if (rowIdx - 1 >= 0) {
            if (3 == directions[rowIdx - 1][colIdx]) {
                exits.push(((rowIdx - 1) * g_numSquares) + colIdx);
            }
        }
        // Check the square below. If its pointing up, add it
        if (rowIdx + 1 < g_numSquares) {
            if (1 == directions[rowIdx + 1][colIdx]) {
                exits.push(((rowIdx + 1) * g_numSquares) + colIdx);
            }
        }
        // Check the square to the left. If its pointing right, add it
        if (colIdx - 1 >= 0) {
            if (2 == directions[rowIdx][colIdx - 1]) {
                exits.push((rowIdx * g_numSquares) + (colIdx - 1));
            }
        }
        // Check the square to the right. If its pointing left, add it
        if (colIdx + 1 < g_numSquares) {
            if (4 == directions[rowIdx][colIdx + 1]) {
                exits.push((rowIdx * g_numSquares) + (colIdx + 1));
            }
        }
    }
    // Now we know the number of squares that lead to exits
    exits.sort();
}
function drawWalls() {
    // Right column
    for (var i = 0; i < g_numSquares; i++) {
        for (var j = 0; j < g_numSquares; j++) {
            var squareDir = directions[i][j];
            // If this square isn't pointing up
            if (1 != squareDir) {
                // Check the square above. If its not pointing down, add a wall
                if (i - 1 >= 0) {
                    if (3 != directions[i - 1][j]) {
                        // Add a wall
                        drawColoredWall(i, j, 1);
                    }
                }
                else {
                    drawColoredWall(i, j, 1);
                }
            }
            // If this square isn't pointing down
            if (3 != squareDir) {
                // Check the square below. If its not pointing up, add a wall
                if (i + 1 < g_numSquares) {
                    if (1 != directions[i + 1][j]) {
                        // Add a wall
                        drawColoredWall(i, j, 3);
                    }
                }
                else {
                    drawColoredWall(i, j, 3);
                }
            }
            // If this square isn't pointing left
            if (4 != squareDir) {
                // Check the square to the left. If its not pointing right, add a wall
                if (j - 1 >= 0) {
                    if (2 != directions[i][j - 1]) {
                        // Add a wall
                        drawColoredWall(i, j, 4);
                    }
                }
                else {
                    drawColoredWall(i, j, 4);
                }
            }
            // If this square isn't pointing right
            if (2 != squareDir) {
                // Check the square to the right. If its not pointing left, add a wall
                if (j + 1 < g_numSquares) {
                    if (4 != directions[i][j + 1]) {
                        // Add a wall
                        drawColoredWall(i, j, 2);
                    }
                }
                else {
                    drawColoredWall(i, j, 2);
                }
            }
        }
    }
}
function drawArrows() {
    for (var i = 0; i < g_numSquares; i++) {
        for (var j = 0; j < g_numSquares; j++) {
            // Add arrow container - pivot from the center of the square
            var newArrow = new Container();
            newArrow.position.set(j * squareSizePx + squareSizePx / 2, i * squareSizePx + squareSizePx / 2);
            // Triangle side is 30% of the square size
            var triangleEdge = (squareSizePx * 0.3);
            var xEdge = (triangleEdge * 0.5);
            var yEdge = Math.sqrt(triangleEdge * triangleEdge - xEdge * xEdge); // b = sqrt(c^2 - a^2)
            var xRatio = (xEdge / triangleEdge);
            var yRatio = (yEdge / triangleEdge);
            var shadowPix = ((squareSizePx * SHADOW_PCT) * 0.5);
            var shadowX = (shadowPix * xRatio);
            var shadowY = (shadowPix * yRatio);
            // Determine if this is a cycle or an exit
            var triangleColor = COLOR_CYCLE;
            if (-1 != exits.indexOf((i * g_numSquares) + j))
                triangleColor = COLOR_EXIT;
            // Draw background triangle
            createTriangle(-xEdge, -xEdge, // left
            0, (-yEdge - xEdge), // top
            xEdge, -xEdge, // right
            triangleColor, 1.0, newArrow);
            // Draw shadow over entire triangle
            createTriangle(-xEdge, -xEdge, // left
            0, (-yEdge - xEdge), // top
            xEdge, -xEdge, // right
            COLOR_SHDW, SHADOW_ARROW_ALPHA, newArrow);
            // Draw unshaded triangle over shadow
            createTriangle((-xEdge + shadowY), (-shadowX - xEdge), // left
            0, (-yEdge + shadowY - xEdge), // top
            (xEdge - (shadowY)), (-shadowX - xEdge), // right
            triangleColor, 1.0, newArrow);
            // Rotate in the correct direction
            newArrow.rotation += (HALF_PI * (directions[i][j] - 1)); // Rotate right, down or left
            boardInner.addChild(newArrow);
        }
    }
}
function setupChecker() {
    // Mark where the checker starts
    createShadowedText("START", 0, 0, "Arial", (squareSizePx / 8), "Orange", "Black", 1.0, 1, 1, startMarker);
    // Create the checker
    createSprite(URL_CHECKER, 0, 0, (squareSizePx * 0.5), (squareSizePx * 0.5), true, checker);
    // Position the marker and the checker
    randomizeCheckerPos();
}
function randomizeCheckerPos() {
    moving = false;
    setCheckerPos(randomInt(0, g_numSquares - 1), randomInt(0, g_numSquares - 1));
}
function setCheckerPos(row, col) {
    currRow = row;
    currCol = col;
    // Calculate the global position of the new row and column
    var checkerXPos = boardInner.getGlobalPosition().x + (squareSizePx * currCol) + (squareSizePx * 0.5);
    var checkerYPos = boardInner.getGlobalPosition().y + (squareSizePx * currRow) + (squareSizePx * 0.5);
    // Position the start marker over the new board position
    startMarker.position.x = checkerXPos;
    startMarker.position.y = checkerYPos;
    // Position the checker over the new board position
    checker.position.x = checkerXPos;
    checker.position.y = checkerYPos;
    turnChecker();
}
function mainLoop() {
    // Start the timer for the next animation loop
    requestAnimationFrame(mainLoop);
    // Update for the current state
    state();
    // Render the scene
    renderer.render(stage);
}
function play() {
    updateChecker();
}
function pause() {
}
function updateChecker() {
    // If not moving, then change direction and get the desired destination
    if (!moving) {
        // If we've gone off the grid, set state to pause, and don't try to move
        if (currCol < 0 || currCol >= g_numSquares ||
            currRow < 0 || currRow >= g_numSquares) {
            state = pause;
            return;
        }
        turnChecker();
        nextSquare();
    }
    else {
        moveStep(1);
    }
}
function turnChecker() {
    // Get a relative turn
    currDir = directions[currRow][currCol];
    var turn = ((currDir - prevDir) + 4) % 4; // 0 - 3
    if (turn > 2)
        turn -= 4;
    checker.rotation += (HALF_PI * turn);
    prevDir = currDir;
}
function nextSquare() {
    var x = checker.position.x;
    var y = checker.position.y;
    switch (currDir) {
        case 1:
            currRow--;
            setDestination(x, y - squareSizePx);
            break;
        case 2:
            currCol++;
            setDestination(x + squareSizePx, y);
            break;
        case 3:
            currRow++;
            setDestination(x, y + squareSizePx);
            break;
        case 4:
            currCol--;
            setDestination(x - squareSizePx, y);
            break;
    }
}
function setDestination(x, y) {
    moving = true;
    destX = x;
    destY = y;
}
function moveStep(speed) {
    switch (currDir) {
        case 1:
            moveUp(speed);
            break;
        case 2:
            moveRight(speed);
            break;
        case 3:
            moveDown(speed);
            break;
        case 4:
            moveLeft(speed);
            break;
    }
    if (checker.position.x == destX && checker.position.y == destY) {
        moving = false;
    }
}
function moveLeft(pix) {
    pix = Math.min(pix, Math.abs(destX - checker.position.x));
    moveX(-pix);
}
function moveRight(pix) {
    pix = Math.min(pix, Math.abs(destX - checker.position.x));
    moveX(pix);
}
function moveUp(pix) {
    pix = Math.min(pix, Math.abs(destY - checker.position.y));
    moveY(-pix);
}
function moveDown(pix) {
    pix = Math.min(pix, Math.abs(destY - checker.position.y));
    moveY(pix);
}
function moveX(pix) {
    checker.position.x += pix;
}
function moveY(pix) {
    checker.position.y += pix;
}
// Get a random integer between min and max (incusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
},{"pixi.js":undefined}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSw4Q0FBOEM7O0FBRTlDLGVBQWU7QUFDZixJQUFPLElBQUksV0FBVyxTQUFTLENBQUMsQ0FBQztBQUVqQyxzQkFBc0I7QUFDdEIsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUMvQixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ3pCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDekIsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDdEMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUM3QixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ3JCLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFFdEIsSUFBTSxPQUFPLEdBQVUsSUFBSSxDQUFDLEVBQUUsR0FBQyxHQUFHLENBQUMsQ0FBQyx5QkFBeUI7QUFFN0QsZ0NBQWdDO0FBQ2hDLElBQU0sVUFBVSxHQUFVLElBQUksQ0FBQyxDQUFDLGdCQUFnQjtBQUNoRCxJQUFNLFVBQVUsR0FBVSxHQUFHLENBQUEsQ0FBQyxpQkFBaUI7QUFDL0MsSUFBTSxnQkFBZ0IsR0FBVSxRQUFRLENBQUMsQ0FBQyxRQUFRO0FBQ2xELElBQU0sa0JBQWtCLEdBQVUsUUFBUSxDQUFDLENBQUMsYUFBYTtBQUN6RCxJQUFNLGFBQWEsR0FBVSxRQUFRLENBQUMsQ0FBQyxjQUFjO0FBQ3JELElBQU0sY0FBYyxHQUFVLFFBQVEsQ0FBQyxDQUFDLFFBQVE7QUFDaEQsSUFBTSxhQUFhLEdBQVUsUUFBUSxDQUFDLENBQUMsY0FBYztBQUNyRCxJQUFNLFlBQVksR0FBVSxRQUFRLENBQUMsQ0FBQyxZQUFZO0FBQ2xELElBQU0s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QUMsQ0FBQyxDQUFDLENBQUM7SUFDMUQsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDaEIsQ0FBQztBQUVELGtCQUFrQixHQUFHO0lBQ2pCLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2YsQ0FBQztBQUVELGVBQWUsR0FBRztJQUNkLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQztBQUM5QixDQUFDO0FBRUQsZUFBZSxHQUFHO0lBQ2QsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDO0FBQzlCLENBQUM7QUFFRCxzREFBc0Q7QUFDdEQsbUJBQW1CLEdBQUcsRUFBRSxHQUFHO0lBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDN0QsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9pbmRleC5kLnRzXCIgLz5cclxuXHJcbi8vIFJlcXVpcmUgUElYSVxyXG5pbXBvcnQgUElYSSA9IHJlcXVpcmUoJ3BpeGkuanMnKTtcclxuXHJcbi8vIERlZmluZSBzb21lIGFsaWFzZXNcclxubGV0IENvbnRhaW5lciA9IFBJWEkuQ29udGFpbmVyO1xyXG5sZXQgTG9hZGVyID0gUElYSS5sb2FkZXI7XHJcbmxldCBTcHJpdGUgPSBQSVhJLlNwcml0ZTtcclxubGV0IFJlc291cmNlcyA9IFBJWEkubG9hZGVyLnJlc291cmNlcztcclxubGV0IEdyYXBoaWNzID0gUElYSS5HcmFwaGljcztcclxubGV0IFRleHQgPSBQSVhJLlRleHQ7XHJcbmxldCBMb2cgPSBjb25zb2xlLmxvZztcclxuXHJcbmNvbnN0IEhBTEZfUEk6bnVtYmVyID0gTWF0aC5QSSowLjU7IC8vIFR1cm4gc3ByaXRlIDkwIGRlZ3JlZXNcclxuXHJcbi8vIEdsb2JhbHMgKGNvbmZpZ3VyYWJsZSBjb25zdHMpXHJcbmNvbnN0IFJFTkRFUkVSX1c6bnVtYmVyID0gMTI4MDsgLy8gSW5pdGlhbCB3aWR0aFxyXG5jb25zdCBSRU5ERVJFUl9IOm51bWJlciA9IDcyMCAvLyBJbml0aWFsIGhlaWdodFxyXG5jb25zdCBDT0xPUl9USVRMRV9GT05UOm51bWJlciA9IDB4QUJERkRGOyAvLyB3aGl0ZVxyXG5jb25zdCBDT0xPUl9CVE5fR1JOX1NIRFc6bnVtYmVyID0gMHgyMjg4MjI7IC8vIGRhcmsgZ3JlZW5cclxuY29uc3QgQ09MT1JfQlROX0dSTjpudW1iZXIgPSAweDc3QUE3NzsgLy8gbGlnaHQgZ3JlZW5cclxuY29uc3QgQ09MT1JfQlROX1RFWFQ6bnVtYmVyID0gMHhERkRGREY7IC8vIHdoaXRlXHJcbmNvbnN0IENPTE9SX1NRX0VWRU46bnVtYmVyID0gMHg2NkZGNjY7IC8vIGxpZ2h0IGdyZWVuXHJcbmNvbnN0IENPTE9SX1NRX09ERDpudW1iZXIgPSAweDQ0NDRBQTsgLy8gZGFyayBibHVlXHJcbmNvbnN0IENPTE9SX1NIRFc6bnVtYmVyID0gMHgyMjIyMTE7IC8vIGRhcmsgYmxhY2tcclxuY29uc3QgQ09MT1JfRVhJVDpudW1iZXIgPSAweEFBRkZBQTsgLy8gbGlnaHQgZ3JlZW5cclxuY29uc3QgQ09MT1JfQ1lDTEU6bnVtYmVyID0gMHhGRkFBQUE7IC8vIGxpZ2h0IHJlZFxyXG5jb25zdCBDT0xPUl9XQUxMOm51bWJlciA9IDB4QkI3Nzc3OyAvLyByZWRcclxuY29uc3QgVVJMX0JBQ0tHUk5EOnN0cmluZyA9IFwiaW1hZ2VzL3dvb2RCa2cuanBlZ1wiO1xyXG5jb25zdCBVUkxfQ0hFQ0tFUjpzdHJpbmcgPSBcImltYWdlcy9idW5ueS5qcGVnXCI7XHJcbmNvbnN0IFVSTF9HUkFTUzpzdHJpbmcgPSBcImltYWdlcy9ncmFzczI1Ni5qcGVnXCI7XHJcbmNvbnN0IFVSTF9NQVJCTEU6c3RyaW5nID0gXCJpbWFnZXMvbWFyYmxlMjU2LmpwZWdcIjtcclxuY29uc3QgRk9OVF9USVRMRTpzdHJpbmcgPSBcIk1hZ25ldG9cIjsgLy8gZm9udFxyXG5jb25zdCBGT05UX0JVVFRPTjpzdHJpbmcgPSBcIkNvb3BlciBTdGQgQmxhY2tcIjsgLy8gZm9udFxyXG5jb25zdCBUSVRMRV9IOm51bWJlciA9IDMwO1xyXG5jb25zdCBTWl9GT05UX1RJVExFOm51bWJlciA9IDI4O1xyXG5jb25zdCBTWl9GT05UX0JVVFRPTjpudW1iZXIgPSAxNDtcclxuY29uc3QgQlVUVE9OX0g6bnVtYmVyID0gODA7XHJcbmNvbnN0IEJVVFRPTl9XOm51bWJlciA9IDE2MDtcclxuY29uc3QgQlVUVE9OX1lfT0ZGU0VUOm51bWJlciA9IDIwO1xyXG5jb25zdCBCVVRUT05fUkFEOm51bWJlciA9IChCVVRUT05fSCowLjUpO1xyXG5jb25zdCBHVUlfVzpudW1iZXIgPSAoQlVUVE9OX1cqMik7XHJcbmNvbnN0IEJVVFRPTl9YOm51bWJlciA9IChHVUlfVyowLjUpIC0gKEJVVFRPTl9XKjAuNSk7XHJcbmNvbnN0IFNIQURPV19QQ1Q6bnVtYmVyID0gMC4xO1xyXG5jb25zdCBTSEFET1dfQUxQSEE6bnVtYmVyID0gMC4zO1xyXG5jb25zdCBTSEFET1dfQVJST1dfQUxQSEE6bnVtYmVyID0gMC44XHJcblxyXG4vLyBHbG9iYWwgKHZhcnMpXHJcbmxldCBnX251bVNxdWFyZXM6bnVtYmVyID0gODsgLy8gU3RhcnQgd2l0aCBhbiA4eDggYm9hcmRcclxubGV0IGdfZ3VpSGVpZ2h0Om51bWJlciA9IDA7XHJcbmxldCBnX2d1aVhQb3M6bnVtYmVyID0gMDtcclxubGV0IG91dGVyQm9hcmRTaXplOm51bWJlciA9IDA7XHJcbmxldCBzcXVhcmVTaXplUHg6bnVtYmVyID0gMDtcclxubGV0IGN1cnJSb3c6bnVtYmVyID0gMDtcclxubGV0IGN1cnJDb2w6bnVtYmVyID0gMDtcclxubGV0IHByZXZEaXI6bnVtYmVyID0gMTtcclxubGV0IGN1cnJEaXI6bnVtYmVyID0gMTtcclxubGV0IGRlc3RYOm51bWJlciA9IDA7XHJcbmxldCBkZXN0WTpudW1iZXIgPSAwO1xyXG5sZXQgbW92aW5nOmJvb2xlYW4gPSBmYWxzZTtcclxubGV0IHN0YXRlOkZ1bmN0aW9uID0gcGF1c2U7XHJcbmxldCBkaXJlY3Rpb25zOkFycmF5PEFycmF5PG51bWJlcj4+ID0gbmV3IEFycmF5KCk7XHJcbmxldCBleGl0czpBcnJheTxudW1iZXI+ID0gbmV3IEFycmF5KCk7XHJcbmxldCBndWk6UElYSS5Db250YWluZXIgPSBuZXcgQ29udGFpbmVyKCk7XHJcbmxldCBib2FyZE91dGVyOlBJWEkuQ29udGFpbmVyID0gbmV3IENvbnRhaW5lcigpO1xyXG5sZXQgYm9hcmRJbm5lcjpQSVhJLkNvbnRhaW5lciA9IG5ldyBDb250YWluZXIoKTtcclxubGV0IGNoZWNrZXI6UElYSS5Db250YWluZXIgPSBuZXcgQ29udGFpbmVyKCk7XHJcbmxldCBzdGFydE1hcmtlcjpQSVhJLkNvbnRhaW5lciA9IG5ldyBDb250YWluZXIoKTtcclxuXHJcbi8vIENyZWF0ZSB0aGUgcmVuZGVyZXJcclxuY29uc3QgcmVuZGVyZXI6UElYSS5XZWJHTFJlbmRlcmVyID0gbmV3IFBJWEkuV2ViR0xSZW5kZXJlcihSRU5ERVJFUl9XLCBSRU5ERVJFUl9IKTtcclxucmVuZGVyZXIuYXV0b1Jlc2l6ZSA9IHRydWU7XHJcbmxldCBWaWV3ID0gcmVuZGVyZXIudmlldztcclxuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChWaWV3KTsgLy8gQWRkIHRoZSByZW5kZXJlciB0byB0aGUgZG9jdW1lbnRcclxuXHJcbi8vIENyZWF0ZSB0aGUgc2NlbmUgKHN0YWdlKVxyXG5jb25zdCBzdGFnZTpQSVhJLkNvbnRhaW5lciA9IG5ldyBDb250YWluZXIoKTtcclxuXHJcbi8vIExvYWQgdGhlIGltYWdlcyB3ZSBuZWVkXHJcbkxvYWRlclxyXG4gICAgLmFkZChbXHJcbiAgICAgICAge3VybDogVVJMX0JBQ0tHUk5EfSxcclxuICAgICAgICB7dXJsOiBVUkxfQ0hFQ0tFUn0sXHJcbiAgICAgICAge3VybDogVVJMX0dSQVNTfSxcclxuICAgICAgICB7dXJsOiBVUkxfTUFSQkxFfVxyXG4gICAgXSlcclxuICAgIC5sb2FkKHNldHVwKVxyXG4gICAgLm9uKFwicHJvZ3Jlc3NcIiwgbG9hZGVyUHJvZ3Jlc3MpO1xyXG5cclxuLy8gQWZ0ZXIgZWFjaCBpbWFnZSBpcyBsb2FkZWRcclxuZnVuY3Rpb24gbG9hZGVyUHJvZ3Jlc3MobG9hZGVyLCByZXNvdXJjZSkge1xyXG4gICAgTG9nKFwiTG9hZGVkOiBcIiArIHJlc291cmNlLnVybCk7XHJcbiAgICBMb2coXCJMb2FkaW5nIFByb2dyZXNzOiBcIiArIGxvYWRlci5wcm9ncmVzcyArIFwiJVwiKTtcclxuXHJcbiAgICAvLyBJZiB0aGUgYmFja2dyb3VuZCBpbWFnZSBoYXMgbG9hZGVkLCBhZGQgaXQsIHRoZW4gYWRkIG90aGVyIGNvbnRhaW5lcnMgdG8gdGhlIHN0YWdlXHJcbiAgICBpZihVUkxfQkFDS0dSTkQgPT0gcmVzb3VyY2UudXJsKSB7XHJcbiAgICAgICAgY3JlYXRlU3ByaXRlKFVSTF9CQUNLR1JORCwgMCwgMCwgVmlldy53aWR0aCwgVmlldy5oZWlnaHQsIGZhbHNlLCBzdGFnZSk7XHJcblxyXG4gICAgICAgIHN0YWdlLmFkZENoaWxkKGJvYXJkT3V0ZXIpO1xyXG4gICAgICAgIGJvYXJkT3V0ZXIuYWRkQ2hpbGQoYm9hcmRJbm5lcik7IC8vIEFkZCB0aGUgaW5uZXIgYm9hcmQgdG8gdGhlIG91dGVyIGJvYXJkXHJcbiAgICAgICAgc3RhZ2UuYWRkQ2hpbGQoc3RhcnRNYXJrZXIpO1xyXG4gICAgICAgIHN0YWdlLmFkZENoaWxkKGNoZWNrZXIpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBBZnRlciBhbGwgaW1hZ2VzIGFyZSBsb2FkZWRcclxuZnVuY3Rpb24gc2V0dXAoKSB7XHJcbiAgICB3aW5kb3cucmVzaXplVG8oVmlldy53aWR0aCwgVmlldy5oZWlnaHQpO1xyXG4gICAgY2FsY1NpemVzQW5kUG9zaXRpb25zKCk7XHJcblxyXG4gICAgc2V0dXBHVUkoKTtcclxuXHJcbiAgICBzZXR1cFRpdGxlKFwiQW1hemluZyBDaGVja2VyYm9hcmRcIik7XHJcblxyXG4gICAgc2V0dXBCb2FyZCgpO1xyXG5cclxuICAgIHNldHVwQ2hlY2tlcigpO1xyXG5cclxuICAgIHN0YXRlID0gcGF1c2U7XHJcblxyXG4gICAgLy8gU3RhcnQgdGhlIG1haW4gbG9vcFxyXG4gICAgbWFpbkxvb3AoKTtcclxufVxyXG5cclxuLy8gUmVjYWxjdWxhdGUgb24gcmVzaXplXHJcbmZ1bmN0aW9uIGNhbGNTaXplc0FuZFBvc2l0aW9ucygpIHtcclxuICAgIGxldCBib2FyZE1heFdpZHRoOm51bWJlciA9IFZpZXcud2lkdGggLSBHVUlfVztcclxuICAgIGxldCBib2FyZE1heEhlaWdodDpudW1iZXIgPSBWaWV3LmhlaWdodCAtIFRJVExFX0g7XHJcbiAgICBvdXRlckJvYXJkU2l6ZSA9IE1hdGgubWluKGJvYXJkTWF4V2lkdGgsIGJvYXJkTWF4SGVpZ2h0KTtcclxuICAgIGdfZ3VpWFBvcyA9IChWaWV3LndpZHRoIC0gb3V0ZXJCb2FyZFNpemUgLSBHVUlfVykgLyAyO1xyXG5cclxuICAgIHJlcG9zaXRpb25Cb2FyZCgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXR1cEdVSSgpIHtcclxuICAgIGxldCBidXR0b25ZUG9zOm51bWJlciA9IDA7XHJcblxyXG4gICAgLy8gUGxheVxyXG4gICAgY3JlYXRlQnV0dG9uKEJVVFRPTl9YLCBidXR0b25ZUG9zLCBCVVRUT05fVywgQlVUVE9OX0gsXHJcbiAgICAgICAgXCJQTEFZXCIsIENPTE9SX0JUTl9HUk4sIENPTE9SX0JUTl9HUk5fU0hEVywgQ09MT1JfQlROX1RFWFQsIG9uUGxheSwgZ3VpKTtcclxuICAgIGJ1dHRvbllQb3MgKz0gKEJVVFRPTl9IICsgQlVUVE9OX1lfT0ZGU0VUKTtcclxuXHJcbiAgICAvLyBQYXVzZVxyXG4gICAgY3JlYXRlQnV0dG9uKEJVVFRPTl9YLCBidXR0b25ZUG9zLCBCVVRUT05fVywgQlVUVE9OX0gsXHJcbiAgICAgICAgXCJQQVVTRVwiLCBDT0xPUl9CVE5fR1JOLCBDT0xPUl9CVE5fR1JOX1NIRFcsIENPTE9SX0JUTl9URVhULCBvblBhdXNlLCBndWkpO1xyXG4gICAgYnV0dG9uWVBvcyArPSAoQlVUVE9OX0ggKyBCVVRUT05fWV9PRkZTRVQpO1xyXG5cclxuICAgIC8vIFJlc2V0IGNoZWNrZXJcclxuICAgIGNyZWF0ZUJ1dHRvbihCVVRUT05fWCwgYnV0dG9uWVBvcywgQlVUVE9OX1csIEJVVFRPTl9ILFxyXG4gICAgICAgIFwiUkVTRVQgQ0hFQ0tFUlwiLCBDT0xPUl9CVE5fR1JOLCBDT0xPUl9CVE5fR1JOX1NIRFcsIENPTE9SX0JUTl9URVhULCBvblJlc2V0Q2hlY2tlciwgZ3VpKTtcclxuICAgIGJ1dHRvbllQb3MgKz0gKEJVVFRPTl9IICsgQlVUVE9OX1lfT0ZGU0VUKTtcclxuXHJcbiAgICAvLyBSZXNldCBCb2FyZCAoYW5kIGNoZWNrZXIpXHJcbiAgICBjcmVhdGVCdXR0b24oQlVUVE9OX1gsIGJ1dHRvbllQb3MsIEJVVFRPTl9XLCBCVVRUT05fSCxcclxuICAgICAgICBcIlJFU0VUIEJPQVJEXCIsIENPTE9SX0JUTl9HUk4sIENPTE9SX0JUTl9HUk5fU0hEVywgQ09MT1JfQlROX1RFWFQsIG9uUmVzZXRCb2FyZCwgZ3VpKTtcclxuXHJcbiAgICBnX2d1aUhlaWdodCA9IGJ1dHRvbllQb3MgKyBCVVRUT05fSDtcclxuXHJcbiAgICByZXBvc2l0aW9uR1VJKCk7XHJcblxyXG4gICAgc3RhZ2UuYWRkQ2hpbGQoZ3VpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVwb3NpdGlvbkdVSSgpIHtcclxuICAgIGd1aS5wb3NpdGlvbi5zZXQoZ19ndWlYUG9zLCBUSVRMRV9IICsgKG91dGVyQm9hcmRTaXplLzIpIC0gKGdfZ3VpSGVpZ2h0LzIpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVwb3NpdGlvbkJvYXJkKCkge1xyXG4gICAgLy8gUG9zaXRpb24gdGhlIGJvYXJkXHJcbiAgICBib2FyZE91dGVyLnBvc2l0aW9uLnNldChnX2d1aVhQb3MgKyBHVUlfVywgVElUTEVfSCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVRyaWFuZ2xlKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIGNvbG9yLCBhbHBoYSwgY29udGFpbmVyKSB7XHJcbiAgICB2YXIgbmV3VHJpYW5nbGU6UElYSS5HcmFwaGljcyA9IG5ldyBHcmFwaGljcygpO1xyXG4gICAgbmV3VHJpYW5nbGUuYmVnaW5GaWxsKGNvbG9yKTtcclxuICAgIG5ld1RyaWFuZ2xlLmFscGhhID0gYWxwaGE7XHJcbiAgICBuZXdUcmlhbmdsZS5kcmF3UG9seWdvbihbXHJcbiAgICAgICAgeDEsIHkxLFxyXG4gICAgICAgIHgyLCB5MixcclxuICAgICAgICB4MywgeTNcclxuICAgIF0pO1xyXG4gICAgbmV3VHJpYW5nbGUuZW5kRmlsbCgpO1xyXG4gICAgY29udGFpbmVyLmFkZENoaWxkKG5ld1RyaWFuZ2xlKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlRXF1aWxhdGVyYWxUcmlhbmdsZShjZW50ZXJYLCBjZW50ZXJZLCBzaWRlTGVuZ3RoLCBjb2xvciwgYWxwaGEsIGNvbnRhaW5lcikge1xyXG5cclxuICAgIC8vY3JlYXRlVHJpYW5nbGUoeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgY29sb3IsIGFscGhhLCBjb250YWluZXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVSZWN0YW5nbGUoeFBvcywgeVBvcywgd2lkdGgsIGhlaWdodCwgcm90YXRpb24sIGNvbG9yLCBhbHBoYSwgY29udGFpbmVyKSB7XHJcbiAgICBsZXQgbmV3UmVjdDpQSVhJLkdyYXBoaWNzID0gbmV3IEdyYXBoaWNzKCk7XHJcbiAgICBuZXdSZWN0LmJlZ2luRmlsbChjb2xvcik7XHJcbiAgICBuZXdSZWN0LmFscGhhID0gYWxwaGE7XHJcbiAgICBuZXdSZWN0LmRyYXdSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgbmV3UmVjdC5lbmRGaWxsKCk7XHJcbiAgICBuZXdSZWN0LnBvc2l0aW9uLnNldCh4UG9zLCB5UG9zKTtcclxuICAgIG5ld1JlY3Qucm90YXRpb24gKz0gcm90YXRpb247XHJcbiAgICBjb250YWluZXIuYWRkQ2hpbGQobmV3UmVjdCk7XHJcbiAgICByZXR1cm4gbmV3UmVjdDtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlU2hhZG93ZWRSZWN0YW5nbGUoeFBvcywgeVBvcywgd2lkdGgsIGhlaWdodCwgcm90YXRpb24sIGNvbG9yLCBzaGFkb3dDb2xvciwgc2hhZG93QWxwaGEsIHNoYWRvd0Rpc3RYLCBzaGFkb3dEaXN0WSwgY29udGFpbmVyKSB7XHJcbiAgICBjcmVhdGVSZWN0YW5nbGUoeFBvcytzaGFkb3dEaXN0WCwgeVBvcytzaGFkb3dEaXN0WSwgd2lkdGgsIGhlaWdodCwgcm90YXRpb24sIHNoYWRvd0NvbG9yLCBzaGFkb3dBbHBoYSwgY29udGFpbmVyKTtcclxuICAgIGNyZWF0ZVJlY3RhbmdsZSh4UG9zLCB5UG9zLCB3aWR0aCwgaGVpZ2h0LCByb3RhdGlvbiwgY29sb3IsIDEuMCwgY29udGFpbmVyKTtcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlUm91bmRlZFJlY3RhbmdsZSh4UG9zLCB5UG9zLCB3aWR0aCwgaGVpZ2h0LCBjb3JuZXJSYWQsIGNvbG9yLCBhbHBoYSwgY29udGFpbmVyKSB7XHJcbiAgICBsZXQgbmV3Um91bmRSZWN0OlBJWEkuR3JhcGhpY3MgPSBuZXcgR3JhcGhpY3MoKTtcclxuICAgIG5ld1JvdW5kUmVjdC5iZWdpbkZpbGwoY29sb3IpO1xyXG4gICAgbmV3Um91bmRSZWN0LmFscGhhID0gYWxwaGE7XHJcbiAgICBuZXdSb3VuZFJlY3QuZHJhd1JvdW5kZWRSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQsIGNvcm5lclJhZCk7XHJcbiAgICBuZXdSb3VuZFJlY3QuZW5kRmlsbCgpO1xyXG4gICAgbmV3Um91bmRSZWN0LnBvc2l0aW9uLnNldCh4UG9zLCB5UG9zKTtcclxuICAgIGNvbnRhaW5lci5hZGRDaGlsZChuZXdSb3VuZFJlY3QpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVTaGFkb3dlZFJvdW5kZWRSZWN0YW5nbGUoeFBvcywgeVBvcywgd2lkdGgsIGhlaWdodCwgY29ybmVyUmFkLCBjb2xvciwgc2hhZG93Q29sb3IsIHNoYWRvd0FscGhhLCBzaGFkb3dEaXN0WCwgc2hhZG93RGlzdFksIGNvbnRhaW5lcikge1xyXG4gICAgY3JlYXRlUm91bmRlZFJlY3RhbmdsZSh4UG9zK3NoYWRvd0Rpc3RYLCB5UG9zK3NoYWRvd0Rpc3RZLCB3aWR0aCwgaGVpZ2h0LCBjb3JuZXJSYWQsIHNoYWRvd0NvbG9yLCBzaGFkb3dBbHBoYSwgY29udGFpbmVyKTtcclxuICAgIGNyZWF0ZVJvdW5kZWRSZWN0YW5nbGUoeFBvcywgeVBvcywgd2lkdGgsIGhlaWdodCwgY29ybmVyUmFkLCBjb2xvciwgMS4wLCBjb250YWluZXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVCdXR0b24oeFBvcywgeVBvcywgd2lkdGgsIGhlaWdodCwgdGV4dCwgY29sb3IsIHNoYWRvd0NvbG9yLCB0ZXh0Q29sb3IsIG9uQ2xpY2tGdW5jLCBjb250YWluZXIpIHtcclxuICAgIC8vIENyZWF0ZSB0aGUgYnV0dG9uIGNvbnRhaW5lclxyXG4gICAgbGV0IG5ld0J1dHRvbjpQSVhJLkNvbnRhaW5lciA9IG5ldyBDb250YWluZXIoKTtcclxuICAgIG5ld0J1dHRvbi5pbnRlcmFjdGl2ZSA9IHRydWU7XHJcbiAgICBuZXdCdXR0b24uYnV0dG9uTW9kZSA9IHRydWU7XHJcbiAgICBuZXdCdXR0b24ub24oJ2NsaWNrJywgb25DbGlja0Z1bmMpO1xyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgc2hhcGUgb2YgdGhlIGJ1dHRvblxyXG4gICAgY3JlYXRlU2hhZG93ZWRSb3VuZGVkUmVjdGFuZ2xlKHhQb3MsIHlQb3MsIHdpZHRoLCBoZWlnaHQsIEJVVFRPTl9SQUQsIGNvbG9yLCBzaGFkb3dDb2xvciwgMS4wLCAwLCA1LCBuZXdCdXR0b24pO1xyXG5cclxuICAgIC8vIFBvc2l0aW9uIHRoZSB0ZXh0IGluIHRoZSBtaWRkbGUgb2YgdGhlIGJ1dHRvblxyXG4gICAgbGV0IGJ1dHRvbk1pZFg6bnVtYmVyID0geFBvcyArICh3aWR0aC8yKTtcclxuICAgIGxldCBidXR0b25NaWRZOm51bWJlciA9IHlQb3MgKyAoaGVpZ2h0LzIpO1xyXG4gICAgY3JlYXRlU2hhZG93ZWRUZXh0KHRleHQsIGJ1dHRvbk1pZFgsIGJ1dHRvbk1pZFksIEZPTlRfQlVUVE9OLCBTWl9GT05UX0JVVFRPTiwgdGV4dENvbG9yLCBzaGFkb3dDb2xvciwgU0hBRE9XX0FMUEhBLCAxLCAxLCBuZXdCdXR0b24pO1xyXG5cclxuICAgIGNvbnRhaW5lci5hZGRDaGlsZChuZXdCdXR0b24pO1xyXG59XHJcblxyXG4vLyBXaGVuIFBsYXkgYnV0dG9uIGlzIHB1c2hlZFxyXG5mdW5jdGlvbiBvblBsYXkoKSB7XHJcbiAgICBzdGF0ZSA9IHBsYXk7XHJcbn1cclxuXHJcbi8vIFdoZW4gUGF1c2UgYnV0dG9uIGlzIHB1c2hlZFxyXG5mdW5jdGlvbiBvblBhdXNlKCkge1xyXG4gICAgc3RhdGUgPSBwYXVzZTtcclxufVxyXG5cclxuLy8gV2hlbiBSZXNldCBDaGVja2VyIGJ1dHRvbiBpcyBwdXNoZWRcclxuZnVuY3Rpb24gb25SZXNldENoZWNrZXIoKSB7XHJcbiAgICBvblBhdXNlKCk7XHJcbiAgICByYW5kb21pemVDaGVja2VyUG9zKCk7XHJcbn1cclxuXHJcbi8vIFdoZW4gUmVzZXQgQm9hcmQgYnV0dG9uIGlzIHB1c2hlZFxyXG5mdW5jdGlvbiBvblJlc2V0Qm9hcmQoKSB7XHJcbiAgICAvLyBUT0RPOiBHZXQgdGhlIG51bWJlciBlbnRlcmVkIGJ5IHVzZXJcclxuICAgIGxldCB1c2VyTnVtOm51bWJlciA9IDg7XHJcblxyXG4gICAgLy8gVE9ETzogSWYgdGhlIHVzZXIncyBudW1iZXIgaXMgdmFsaWQsIHNldHVwIHRoZSBib2FyZFxyXG4gICAgaWYodXNlck51bSA+IDEpIHtcclxuICAgICAgICBnX251bVNxdWFyZXMgPSB1c2VyTnVtO1xyXG4gICAgICAgIG9uUGF1c2UoKTsgLy8gUGF1c2VcclxuICAgICAgICBzZXR1cEJvYXJkKCk7IC8vIFNldHVwIGEgbmV3IGJvYXJkXHJcbiAgICAgICAgcmFuZG9taXplQ2hlY2tlclBvcygpOyAvLyBSZXNpemUgdGhlIGNoZWNrZXIgYW5kIHBpY2sgYSBuZXcgc3BvdFxyXG4gICAgfVxyXG59XHJcblxyXG4vLyBDcmVhdGUgdGhlIHRpdGxlXHJcbmZ1bmN0aW9uIHNldHVwVGl0bGUodGV4dCkge1xyXG4gICAgY3JlYXRlU2hhZG93ZWRUZXh0KHRleHQsIChWaWV3LndpZHRoLzIpLCAoVElUTEVfSC8yKSwgRk9OVF9USVRMRSwgU1pfRk9OVF9USVRMRSwgQ09MT1JfVElUTEVfRk9OVCwgQ09MT1JfU0hEVywgMS4wLCAzLCAzLCBzdGFnZSk7XHJcbn1cclxuXHJcbi8vIENyZWF0ZSBhIHNwcml0ZSB3aXRoIGV4YWN0IHNpemVcclxuZnVuY3Rpb24gY3JlYXRlU3ByaXRlKHVybCwgeFBvcywgeVBvcywgc2l6ZVcsIHNpemVILCBjZW50ZXJlZCwgY29udGFpbmVyKSB7XHJcbiAgICBsZXQgbmV3U3ByaXRlOlBJWEkuU3ByaXRlID0gbmV3IFNwcml0ZShSZXNvdXJjZXNbdXJsXS50ZXh0dXJlKTtcclxuICAgIC8vIFNjYWxlIHRvIGV4YWN0IHNpemVXIGFuZCBzaXplSFxyXG4gICAgbmV3U3ByaXRlLnNjYWxlLnNldCgoc2l6ZVcgLyBuZXdTcHJpdGUud2lkdGgpLCAoc2l6ZUggLyBuZXdTcHJpdGUuaGVpZ2h0KSk7XHJcbiAgICBpZihjZW50ZXJlZClcclxuICAgICAgICBuZXdTcHJpdGUuYW5jaG9yLnNldCgwLjUsIDAuNSk7IC8vIE1vdmVzIHRoZSB0ZXh0dXJlIGNlbnRlcmVkIG92ZXIgaXRzIHBpdm90IHBvaW50XHJcbiAgICBuZXdTcHJpdGUucG9zaXRpb24uc2V0KHhQb3MsIHlQb3MpO1xyXG4gICAgY29udGFpbmVyLmFkZENoaWxkKG5ld1Nwcml0ZSk7XHJcbn1cclxuXHJcbi8vIENyZWF0ZSBzb21lIHRleHRcclxuZnVuY3Rpb24gY3JlYXRlVGV4dCh0ZXh0LCB4UG9zLCB5UG9zLCBmb250LCBmb250U2l6ZSwgZm9udENvbG9yLCBhbHBoYSwgY29udGFpbmVyKSB7XHJcbiAgICBsZXQgbmV3VGV4dDpQSVhJLlRleHQgPVxyXG4gICAgICAgIG5ldyBUZXh0KHRleHQsIHtmb250RmFtaWx5OiBmb250LCBmb250U2l6ZTogZm9udFNpemUsIGZpbGw6IGZvbnRDb2xvcn0pO1xyXG4gICAgbmV3VGV4dC5hbHBoYSA9IGFscGhhO1xyXG4gICAgbmV3VGV4dC5wb3NpdGlvbi5zZXQoeFBvcyAtIG5ld1RleHQud2lkdGgvMiwgeVBvcyAtIG5ld1RleHQuaGVpZ2h0LzIpO1xyXG4gICAgY29udGFpbmVyLmFkZENoaWxkKG5ld1RleHQpO1xyXG59XHJcblxyXG4vLyBDcmVhdGUgYSBzaGFkb3cgbGF5ZXIgb2YgdGV4dCB1bmRlciBub3JtYWwgdGV4dFxyXG5mdW5jdGlvbiBjcmVhdGVTaGFkb3dlZFRleHQodGV4dCwgeFBvcywgeVBvcywgZm9udCwgZm9udFNpemUsIGZvbnRDb2xvciwgc2hhZG93Q29sb3IsIHNoYWRvd0FscGhhLCBzaGFkb3dEaXN0WCwgc2hhZG93RGlzdFksIGNvbnRhaW5lcikge1xyXG4gICAgLy8gQ3JlYXRlIHRoZSBzaGFkb3cgdGV4dCBmaXJzdFxyXG4gICAgY3JlYXRlVGV4dCh0ZXh0LCB4UG9zK3NoYWRvd0Rpc3RYLCB5UG9zK3NoYWRvd0Rpc3RZLCBmb250LCBmb250U2l6ZSwgc2hhZG93Q29sb3IsIHNoYWRvd0FscGhhLCBjb250YWluZXIpO1xyXG4gICAgY3JlYXRlVGV4dCh0ZXh0LCB4UG9zLCB5UG9zLCBmb250LCBmb250U2l6ZSwgZm9udENvbG9yLCAxLjAsIGNvbnRhaW5lcik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldHVwQm9hcmQoKSB7XHJcbiAgICAvLyBSZW1vdmUgZXZlcnl0aGluZyBwcmV2aW91c2x5IG9uIHRoZSBib2FyZFxyXG4gICAgYm9hcmRJbm5lci5yZW1vdmVDaGlsZHJlbigpO1xyXG5cclxuICAgIC8vIFNldHVwIG5ldyByYW5kb20gZGlyZWN0aW9uc1xyXG4gICAgcmFuZG9taXplRGlyZWN0aW9ucygpO1xyXG5cclxuICAgIC8qIEFsZ29yaXRobSB0byBkZXRlcm1pbmUgd2hpY2ggc3F1YXJlcyB3aWxsIGxlYWQgdG8gZXhpdHNcclxuICAgIHZzLiB3aGljaCB3aWxsIGxlYWQgdG8gY3ljbGVzICovXHJcbiAgICBjYWxjdWxhdGVFeGl0cygpO1xyXG5cclxuICAgIC8vIFBvc2l0aW9uIHRoZSBpbm5lciBib2FyZCBjb250YWluZXJcclxuICAgIGxldCBpbm5lck91dGVyUmF0aW86bnVtYmVyID0gZ19udW1TcXVhcmVzLyhnX251bVNxdWFyZXMrMik7XHJcbiAgICBsZXQgaW5uZXJCb2FyZFNpemU6bnVtYmVyID0gaW5uZXJPdXRlclJhdGlvKm91dGVyQm9hcmRTaXplO1xyXG4gICAgbGV0IGJvYXJkSW5uZXJPdXRlck9mZnNldDpudW1iZXIgPSAob3V0ZXJCb2FyZFNpemUgLSBpbm5lckJvYXJkU2l6ZSkgLyAyO1xyXG4gICAgYm9hcmRJbm5lci5wb3NpdGlvbi5zZXQoYm9hcmRJbm5lck91dGVyT2Zmc2V0LCBib2FyZElubmVyT3V0ZXJPZmZzZXQpO1xyXG5cclxuICAgIC8vIFNldCB0aGUgbmV3IHNxdWFyZSBzaXplXHJcbiAgICBzcXVhcmVTaXplUHggPSBpbm5lckJvYXJkU2l6ZSAvIGdfbnVtU3F1YXJlcztcclxuXHJcbiAgICAvLyBEcmF3IHRoZSBzcXVhcmVzXHJcbiAgICBkcmF3U3F1YXJlcygpO1xyXG5cclxuICAgIC8vIERyYXcgYXJyb3dzIG9uIHRvcCBvZiBzcXVhcmVzXHJcbiAgICBkcmF3QXJyb3dzKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRyYXdTcXVhcmVzKCkge1xyXG4gICAgLy8gRHJhdyBvZGQgb25lcyBmaXJzdFxyXG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgZ19udW1TcXVhcmVzOyBpKyspIHtcclxuICAgICAgICBmb3IgKGxldCBqOm51bWJlciA9IDA7IGogPCBnX251bVNxdWFyZXM7IGorKykge1xyXG4gICAgICAgICAgICBpZigoaStqKSAlIDIpIHtcclxuICAgICAgICAgICAgICAgIC8vZHJhd0NvbG9yZWRTcXVhcmUoaSwgaik7XHJcbiAgICAgICAgICAgICAgICBkcmF3VGV4dHVyZVNxdWFyZShpLCBqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIERyYXcgc2hhZG93cyBzbyB0aGV5IHdpbGwgc2hhZGUgdGhlIG9kZCBvbmVzIGZyb20gdGhlIGV2ZW4gb25lc1xyXG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgZ19udW1TcXVhcmVzOyBpKyspIHtcclxuICAgICAgICBmb3IgKGxldCBqOm51bWJlciA9IDA7IGogPCBnX251bVNxdWFyZXM7IGorKykge1xyXG4gICAgICAgICAgICBpZigwID09IChpK2opICUgMikge1xyXG4gICAgICAgICAgICAgICAgZHJhd1NoYWRvd09mU3F1YXJlKGksIGopO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gRHJhdyBldmVuIG9uZXMgb24gdG9wIG9mIHNoYWRvd3NcclxuICAgIGZvciAobGV0IGk6bnVtYmVyID0gMDsgaSA8IGdfbnVtU3F1YXJlczsgaSsrKSB7XHJcbiAgICAgICAgZm9yIChsZXQgajpudW1iZXIgPSAwOyBqIDwgZ19udW1TcXVhcmVzOyBqKyspIHtcclxuICAgICAgICAgICAgaWYoMCA9PSAoaStqKSAlIDIpIHtcclxuICAgICAgICAgICAgICAgIC8vZHJhd0NvbG9yZWRTcXVhcmUoaSwgaik7XHJcbiAgICAgICAgICAgICAgICBkcmF3VGV4dHVyZVNxdWFyZShpLCBqKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBEcmF3IHRoZSB3YWxscyBvbiB0b3Agb2Ygc3F1YXJlc1xyXG4gICAgZHJhd1dhbGxzKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRyYXdDb2xvcmVkV2FsbChyb3csIGNvbCwgZGlyKSB7XHJcbiAgICBsZXQgd2FsbFdpZHRoOm51bWJlciA9IChzcXVhcmVTaXplUHgqMC4xKTtcclxuICAgIGxldCBoYWxmV2FsbFc6bnVtYmVyID0gKHdhbGxXaWR0aCowLjUpO1xyXG4gICAgbGV0IHdhbGxMZW5ndGg6bnVtYmVyID0gKHNxdWFyZVNpemVQeCt3YWxsV2lkdGgpO1xyXG4gICAgbGV0IHhQb3M6bnVtYmVyID0gKGNvbCpzcXVhcmVTaXplUHgpO1xyXG4gICAgbGV0IHlQb3M6bnVtYmVyID0gKHJvdypzcXVhcmVTaXplUHgpO1xyXG5cclxuICAgIGxldCB3YWxsOlBJWEkuR3JhcGhpY3MgPSBjcmVhdGVSZWN0YW5nbGUoeFBvcywgeVBvcywgd2FsbExlbmd0aCwgd2FsbFdpZHRoLCAwLjAsIENPTE9SX1dBTEwsIDEuMCwgYm9hcmRJbm5lcik7XHJcblxyXG4gICAgLy8gUm90YXRlIGFuZC9vciBtb3ZlIHRoZSB3YWxsXHJcbiAgICBzd2l0Y2goZGlyKSB7XHJcbiAgICBjYXNlIDE6IC8vIFVwXHJcbiAgICAgICAgd2FsbC5wb3NpdGlvbi5zZXQoKHhQb3MtaGFsZldhbGxXKSwgKHlQb3MtaGFsZldhbGxXKSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDI6IC8vIFJpZ2h0XHJcbiAgICAgICAgd2FsbC5yb3RhdGlvbiArPSBIQUxGX1BJO1xyXG4gICAgICAgIHdhbGwucG9zaXRpb24uc2V0KCh4UG9zK3NxdWFyZVNpemVQeCtoYWxmV2FsbFcpLCAoeVBvcy1oYWxmV2FsbFcpKTtcclxuICAgICAgICBicmVhaztcclxuICAgIGNhc2UgMzogLy8gQm90dG9tXHJcbiAgICAgICAgd2FsbC5wb3NpdGlvbi5zZXQoKHhQb3MtaGFsZldhbGxXKSwgKHlQb3Mrc3F1YXJlU2l6ZVB4LWhhbGZXYWxsVykpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSA0OiAvLyBMZWZ0XHJcbiAgICAgICAgd2FsbC5yb3RhdGlvbiArPSBIQUxGX1BJO1xyXG4gICAgICAgIHdhbGwucG9zaXRpb24uc2V0KCh4UG9zK2hhbGZXYWxsVyksICh5UG9zLWhhbGZXYWxsVykpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBEcmF3IGEgbGlnaHQgb3IgZGFyayBjb2xvciBzcXVhcmUgZGVwZW5kaW5nIG9uIHRoZSBwb3NpdGlvblxyXG5mdW5jdGlvbiBkcmF3Q29sb3JlZFNxdWFyZShyb3csIGNvbCkge1xyXG4gICAgbGV0IHhQb3M6bnVtYmVyID0gKGNvbCpzcXVhcmVTaXplUHgpO1xyXG4gICAgbGV0IHlQb3M6bnVtYmVyID0gKHJvdypzcXVhcmVTaXplUHgpO1xyXG4gICAgbGV0IHNxdWFyZUNvbG9yOm51bWJlciA9IENPTE9SX1NRX0VWRU47IC8vIEV2ZW4gY29sb3JcclxuICAgIGlmKChyb3crY29sKSAlIDIpIHtcclxuICAgICAgICBzcXVhcmVDb2xvciA9IENPTE9SX1NRX09ERDsgLy8gT2RkIGNvbG9yXHJcbiAgICB9XHJcbiAgICBjcmVhdGVSZWN0YW5nbGUoeFBvcywgeVBvcywgc3F1YXJlU2l6ZVB4LCBzcXVhcmVTaXplUHgsIDAuMCwgc3F1YXJlQ29sb3IsIDEuMCwgYm9hcmRJbm5lcik7XHJcbn1cclxuXHJcbi8vIERyYXcgYSBzcXVhcmUgd2l0aCBvbmUgb2YgdHdvIHRleHR1cmVzIGRlcGVuZGluZyBvbiBwb3NpdGlvblxyXG5mdW5jdGlvbiBkcmF3VGV4dHVyZVNxdWFyZShyb3csIGNvbCkge1xyXG4gICAgbGV0IHhQb3M6bnVtYmVyID0gKGNvbCpzcXVhcmVTaXplUHgpO1xyXG4gICAgbGV0IHlQb3M6bnVtYmVyID0gKHJvdypzcXVhcmVTaXplUHgpO1xyXG4gICAgbGV0IHRleHR1cmVVUkw6c3RyaW5nID0gVVJMX01BUkJMRTsgLy8gTWFyYmxlIG9uIGV2ZW5zXHJcbiAgICBpZigocm93K2NvbCkgJSAyKSB7XHJcbiAgICAgICAgdGV4dHVyZVVSTCA9IFVSTF9HUkFTUzsgLy8gR3Jhc3Mgb24gb2Rkc1xyXG4gICAgfVxyXG4gICAgY3JlYXRlU3ByaXRlKHRleHR1cmVVUkwsIHhQb3MsIHlQb3MsIHNxdWFyZVNpemVQeCwgc3F1YXJlU2l6ZVB4LCBmYWxzZSwgYm9hcmRJbm5lcik7XHJcbn1cclxuXHJcbi8vIERyYXcgYSBzaGFkb3cgYXQgdGhlIGRlc2lyZWQgc3F1YXJlXHJcbmZ1bmN0aW9uIGRyYXdTaGFkb3dPZlNxdWFyZShyb3csIGNvbCkge1xyXG4gICAgbGV0IG9yaWdYUG9zOm51bWJlciA9IChjb2wqc3F1YXJlU2l6ZVB4KTtcclxuICAgIGxldCBvcmlnWVBvczpudW1iZXIgPSAocm93KnNxdWFyZVNpemVQeCk7XHJcbiAgICBsZXQgc2hhZG93UHg6bnVtYmVyID0gKHNxdWFyZVNpemVQeCpTSEFET1dfUENUKTtcclxuICAgIGxldCBzaGFkb3dYUG9zOm51bWJlciA9IG9yaWdYUG9zICsgc2hhZG93UHg7XHJcbiAgICBsZXQgc2hhZG93WVBvczpudW1iZXIgPSBvcmlnWVBvcyArIHNoYWRvd1B4O1xyXG5cclxuICAgIC8vIERyYXcgdGhlIHNxdWFyZSdzIHNoYWRvd1xyXG4gICAgY3JlYXRlUmVjdGFuZ2xlKHNoYWRvd1hQb3MsIHNoYWRvd1lQb3MsIHNxdWFyZVNpemVQeCwgc3F1YXJlU2l6ZVB4LCAwLjAsIENPTE9SX1NIRFcsIFNIQURPV19BTFBIQSwgYm9hcmRJbm5lcik7XHJcblxyXG4gICAgLy8gRHJhdyBjb25uZWN0aW5nIHRyaWFuZ2xlIHNoYWRvdyAodXBwZXIgcmlnaHQpXHJcbiAgICBjcmVhdGVUcmlhbmdsZShcclxuICAgICAgICAob3JpZ1hQb3Mrc3F1YXJlU2l6ZVB4KSwgb3JpZ1lQb3MsXHJcbiAgICAgICAgKG9yaWdYUG9zK3NxdWFyZVNpemVQeCksIHNoYWRvd1lQb3MsXHJcbiAgICAgICAgKHNoYWRvd1hQb3Mrc3F1YXJlU2l6ZVB4KSwgc2hhZG93WVBvcyxcclxuICAgICAgICBDT0xPUl9TSERXLCBTSEFET1dfQUxQSEEsIGJvYXJkSW5uZXIpO1xyXG5cclxuICAgIC8vIERyYXcgY29ubmVjdGluZyB0cmlhbmdsZSBzaGFkb3cgKGxvd2VyIGxlZnQpXHJcbiAgICBjcmVhdGVUcmlhbmdsZShcclxuICAgICAgICBvcmlnWFBvcywgKG9yaWdZUG9zK3NxdWFyZVNpemVQeCksXHJcbiAgICAgICAgc2hhZG93WFBvcywgKG9yaWdZUG9zK3NxdWFyZVNpemVQeCksXHJcbiAgICAgICAgc2hhZG93WFBvcywgKHNoYWRvd1lQb3Mrc3F1YXJlU2l6ZVB4KSxcclxuICAgICAgICBDT0xPUl9TSERXLCBTSEFET1dfQUxQSEEsIGJvYXJkSW5uZXIpO1xyXG59XHJcblxyXG4vLyBTZXR1cCByYW5kb20gZGlyZWN0aW9uIGZvciBlYWNoIHNxdWFyZSBvbiB0aGUgYm9hcmRcclxuZnVuY3Rpb24gcmFuZG9taXplRGlyZWN0aW9ucygpIHtcclxuICAgIC8vIEdldCB0aGUgcHJldmlvdXMgc2l6ZSBzbyB3ZSBjYW4gZGVhbGxvY2F0ZS9hbGxvY2F0ZSBtZW1vcnkgYXMgbmVlZGVkXHJcbiAgICBsZXQgcHJldk51bVNxdWFyZXM6bnVtYmVyID0gZGlyZWN0aW9ucy5sZW5ndGg7XHJcbiAgICBsZXQgbGFyZ2VyOm51bWJlciA9IE1hdGgubWF4KHByZXZOdW1TcXVhcmVzLCBnX251bVNxdWFyZXMpO1xyXG5cclxuICAgIC8vIEdvIHRocm91Z2ggdG8gdGhlIGxhcmdlciBudW1iZXIgc28gd2UgY2FuIGFsbG9jYXRlL2RlYWxsb2NhdGUgbWVtb3J5XHJcbiAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCBsYXJnZXI7IGkrKykge1xyXG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSB0b28gbWFueSByb3dzLCByZW1vdmUgdGhlIGJvdHRvbSBvbmVcclxuICAgICAgICBpZiAoaSA+IGdfbnVtU3F1YXJlcy0xKSB7XHJcbiAgICAgICAgICAgIGRpcmVjdGlvbnMucG9wKCk7XHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vdCBlbm91Z2ggcm93cywgYWxsb2NhdGUgYSBuZXcgcm93XHJcbiAgICAgICAgaWYoaSA+IHByZXZOdW1TcXVhcmVzLTEpIHtcclxuICAgICAgICAgICAgZGlyZWN0aW9uc1tpXSA9IG5ldyBBcnJheShnX251bVNxdWFyZXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gR2V0IGEgcmFuZG9tIGRpcmVjdGlvbiBmb3IgZWFjaCBzcXVhcmVcclxuICAgICAgICBmb3IgKGxldCBqOm51bWJlciA9IDA7IGogPCBnX251bVNxdWFyZXM7IGorKykge1xyXG4gICAgICAgICAgICBkaXJlY3Rpb25zW2ldW2pdID0gcmFuZG9tSW50KDEsIDQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gY2FsY3VsYXRlRXhpdHMoKSB7XHJcbiAgICAvLyBDbGVhciB0aGUgbGlzdCBvZiBleGl0c1xyXG4gICAgbGV0IG51bUV4aXRzOm51bWJlciA9IGV4aXRzLmxlbmd0aDtcclxuICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgbnVtRXhpdHM7IGkrKylcclxuICAgICAgICBleGl0cy5wb3AoKTtcclxuXHJcbiAgICAvLyBUb3Agcm93XHJcbiAgICBmb3IgKGxldCBqOm51bWJlciA9IDA7IGogPCBnX251bVNxdWFyZXM7IGorKykge1xyXG4gICAgICAgIC8vIElmIGl0cyBwb2ludGluZyB1cCwgaXRzIGFuIGV4aXRcclxuICAgICAgICBpZigxID09IGRpcmVjdGlvbnNbMF1bal0pIHtcclxuICAgICAgICAgICAgZXhpdHMucHVzaChqKTsgLy8gUHV0IHRoaXMgc3F1YXJlIGluIHRoZSBleGl0cyBhcnJheVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIEJvdHRvbSByb3dcclxuICAgIGZvciAobGV0IGo6bnVtYmVyID0gMDsgaiA8IGdfbnVtU3F1YXJlczsgaisrKSB7XHJcbiAgICAgICAgLy8gSWYgaXRzIHBvaW50aW5nIGRvd24sIGl0cyBhbiBleGl0XHJcbiAgICAgICAgaWYoMyA9PSBkaXJlY3Rpb25zW2dfbnVtU3F1YXJlcy0xXVtqXSkge1xyXG4gICAgICAgICAgICBleGl0cy5wdXNoKCgoZ19udW1TcXVhcmVzLTEpKmdfbnVtU3F1YXJlcykgKyBqKTsgLy8gUHV0IHRoaXMgc3F1YXJlIGluIHRoZSBleGl0cyBhcnJheVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIExlZnQgY29sdW1uXHJcbiAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCBnX251bVNxdWFyZXM7IGkrKykge1xyXG4gICAgICAgIC8vIElmIGl0cyBwb2ludGluZyBsZWZ0LCBpdHMgYW4gZXhpdFxyXG4gICAgICAgIGlmKDQgPT0gZGlyZWN0aW9uc1tpXVswXSkge1xyXG4gICAgICAgICAgICBleGl0cy5wdXNoKGkqZ19udW1TcXVhcmVzKTsgLy8gUHV0IHRoaXMgc3F1YXJlIGluIHRoZSBleGl0cyBhcnJheVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIFJpZ2h0IGNvbHVtblxyXG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgZ19udW1TcXVhcmVzOyBpKyspIHtcclxuICAgICAgICAvLyBJZiBpdHMgcG9pbnRpbmcgcmlnaHQsIGl0cyBhbiBleGl0XHJcbiAgICAgICAgaWYoMiA9PSBkaXJlY3Rpb25zW2ldW2dfbnVtU3F1YXJlcy0xXSkge1xyXG4gICAgICAgICAgICBleGl0cy5wdXNoKChpKmdfbnVtU3F1YXJlcykgKyAoZ19udW1TcXVhcmVzLTEpKTsgLy8gUHV0IHRoaXMgc3F1YXJlIGluIHRoZSBleGl0cyBhcnJheVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBOb3cgd2Uga25vdyB0aGUgbnVtYmVyIG9mIGV4aXRzXHJcblxyXG4gICAgLy8gTm93IHN0ZXAgdGhyb3VnaCB0aGUgZXhpdHMgYXJyYXksIGFuZCBjb250aW51YWxseSBhZGQgYW55IHNxdWFyZXMgd2hpY2ggcG9pbnQgdG8gZXhpdHNcclxuICAgIGZvcihsZXQgaTpudW1iZXIgPSAwOyBpIDwgZXhpdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBsZXQgc3F1YXJlSWR4Om51bWJlciA9IGV4aXRzW2ldO1xyXG4gICAgICAgIGxldCByb3dJZHg6bnVtYmVyID0gTWF0aC5mbG9vcihzcXVhcmVJZHgvZ19udW1TcXVhcmVzKTsgLy8gR2V0IHRoZSByb3cgb2YgdGhpcyBzcXVhcmVcclxuICAgICAgICBsZXQgY29sSWR4Om51bWJlciA9IHNxdWFyZUlkeCAlIGdfbnVtU3F1YXJlczsgLy8gR2V0IHRoZSBjb2x1bW4gb2YgdGhpcyBzcXVhcmVcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgdGhlIHNxdWFyZSBhYm92ZS4gSWYgaXRzIHBvaW50aW5nIGRvd24sIGFkZCBpdFxyXG4gICAgICAgIGlmKHJvd0lkeC0xID49IDApIHtcclxuICAgICAgICAgICAgaWYoMyA9PSBkaXJlY3Rpb25zW3Jvd0lkeC0xXVtjb2xJZHhdKSB7XHJcbiAgICAgICAgICAgICAgICBleGl0cy5wdXNoKCgocm93SWR4LTEpKmdfbnVtU3F1YXJlcykgKyBjb2xJZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIENoZWNrIHRoZSBzcXVhcmUgYmVsb3cuIElmIGl0cyBwb2ludGluZyB1cCwgYWRkIGl0XHJcbiAgICAgICAgaWYocm93SWR4KzEgPCBnX251bVNxdWFyZXMpIHtcclxuICAgICAgICAgICAgaWYoMSA9PSBkaXJlY3Rpb25zW3Jvd0lkeCsxXVtjb2xJZHhdKSB7XHJcbiAgICAgICAgICAgICAgICBleGl0cy5wdXNoKCgocm93SWR4KzEpKmdfbnVtU3F1YXJlcykgKyBjb2xJZHgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIENoZWNrIHRoZSBzcXVhcmUgdG8gdGhlIGxlZnQuIElmIGl0cyBwb2ludGluZyByaWdodCwgYWRkIGl0XHJcbiAgICAgICAgaWYoY29sSWR4LTEgPj0gMCkge1xyXG4gICAgICAgICAgICBpZigyID09IGRpcmVjdGlvbnNbcm93SWR4XVtjb2xJZHgtMV0pIHtcclxuICAgICAgICAgICAgICAgIGV4aXRzLnB1c2goKHJvd0lkeCpnX251bVNxdWFyZXMpICsgKGNvbElkeC0xKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQ2hlY2sgdGhlIHNxdWFyZSB0byB0aGUgcmlnaHQuIElmIGl0cyBwb2ludGluZyBsZWZ0LCBhZGQgaXRcclxuICAgICAgICBpZihjb2xJZHgrMSA8IGdfbnVtU3F1YXJlcykge1xyXG4gICAgICAgICAgICBpZig0ID09IGRpcmVjdGlvbnNbcm93SWR4XVtjb2xJZHgrMV0pIHtcclxuICAgICAgICAgICAgICAgIGV4aXRzLnB1c2goKHJvd0lkeCpnX251bVNxdWFyZXMpICsgKGNvbElkeCsxKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTm93IHdlIGtub3cgdGhlIG51bWJlciBvZiBzcXVhcmVzIHRoYXQgbGVhZCB0byBleGl0c1xyXG5cclxuICAgIGV4aXRzLnNvcnQoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZHJhd1dhbGxzKCkge1xyXG4gICAgLy8gUmlnaHQgY29sdW1uXHJcbiAgICBmb3IgKGxldCBpOm51bWJlciA9IDA7IGkgPCBnX251bVNxdWFyZXM7IGkrKykge1xyXG4gICAgICAgIGZvciAobGV0IGo6bnVtYmVyID0gMDsgaiA8IGdfbnVtU3F1YXJlczsgaisrKSB7XHJcbiAgICAgICAgICAgIGxldCBzcXVhcmVEaXI6bnVtYmVyID0gZGlyZWN0aW9uc1tpXVtqXTtcclxuXHJcbiAgICAgICAgICAgIC8vIElmIHRoaXMgc3F1YXJlIGlzbid0IHBvaW50aW5nIHVwXHJcbiAgICAgICAgICAgIGlmKDEgIT0gc3F1YXJlRGlyKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgc3F1YXJlIGFib3ZlLiBJZiBpdHMgbm90IHBvaW50aW5nIGRvd24sIGFkZCBhIHdhbGxcclxuICAgICAgICAgICAgICAgIGlmKGktMSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoMyAhPSBkaXJlY3Rpb25zW2ktMV1bal0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGEgd2FsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3Q29sb3JlZFdhbGwoaSwgaiwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJhd0NvbG9yZWRXYWxsKGksIGosIDEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGlzIHNxdWFyZSBpc24ndCBwb2ludGluZyBkb3duXHJcbiAgICAgICAgICAgIGlmKDMgIT0gc3F1YXJlRGlyKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgc3F1YXJlIGJlbG93LiBJZiBpdHMgbm90IHBvaW50aW5nIHVwLCBhZGQgYSB3YWxsXHJcbiAgICAgICAgICAgICAgICBpZihpKzEgPCBnX251bVNxdWFyZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZigxICE9IGRpcmVjdGlvbnNbaSsxXVtqXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgYSB3YWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRyYXdDb2xvcmVkV2FsbChpLCBqLCAzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBkcmF3Q29sb3JlZFdhbGwoaSwgaiwgMyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIElmIHRoaXMgc3F1YXJlIGlzbid0IHBvaW50aW5nIGxlZnRcclxuICAgICAgICAgICAgaWYoNCAhPSBzcXVhcmVEaXIpIHtcclxuICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBzcXVhcmUgdG8gdGhlIGxlZnQuIElmIGl0cyBub3QgcG9pbnRpbmcgcmlnaHQsIGFkZCBhIHdhbGxcclxuICAgICAgICAgICAgICAgIGlmKGotMSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoMiAhPSBkaXJlY3Rpb25zW2ldW2otMV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGEgd2FsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3Q29sb3JlZFdhbGwoaSwgaiwgNCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJhd0NvbG9yZWRXYWxsKGksIGosIDQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBJZiB0aGlzIHNxdWFyZSBpc24ndCBwb2ludGluZyByaWdodFxyXG4gICAgICAgICAgICBpZigyICE9IHNxdWFyZURpcikge1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIHNxdWFyZSB0byB0aGUgcmlnaHQuIElmIGl0cyBub3QgcG9pbnRpbmcgbGVmdCwgYWRkIGEgd2FsbFxyXG4gICAgICAgICAgICAgICAgaWYoaisxIDwgZ19udW1TcXVhcmVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoNCAhPSBkaXJlY3Rpb25zW2ldW2orMV0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGEgd2FsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkcmF3Q29sb3JlZFdhbGwoaSwgaiwgMik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJhd0NvbG9yZWRXYWxsKGksIGosIDIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkcmF3QXJyb3dzKCkge1xyXG4gICAgZm9yIChsZXQgaTpudW1iZXIgPSAwOyBpIDwgZ19udW1TcXVhcmVzOyBpKyspIHtcclxuICAgICAgICBmb3IgKGxldCBqOm51bWJlciA9IDA7IGogPCBnX251bVNxdWFyZXM7IGorKykge1xyXG4gICAgICAgICAgICAvLyBBZGQgYXJyb3cgY29udGFpbmVyIC0gcGl2b3QgZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBzcXVhcmVcclxuICAgICAgICAgICAgbGV0IG5ld0Fycm93OlBJWEkuQ29udGFpbmVyID0gbmV3IENvbnRhaW5lcigpO1xyXG4gICAgICAgICAgICBuZXdBcnJvdy5wb3NpdGlvbi5zZXQoaipzcXVhcmVTaXplUHggKyBzcXVhcmVTaXplUHgvMiwgaSpzcXVhcmVTaXplUHggKyBzcXVhcmVTaXplUHgvMik7XHJcblxyXG4gICAgICAgICAgICAvLyBUcmlhbmdsZSBzaWRlIGlzIDMwJSBvZiB0aGUgc3F1YXJlIHNpemVcclxuICAgICAgICAgICAgbGV0IHRyaWFuZ2xlRWRnZTpudW1iZXIgPSAoc3F1YXJlU2l6ZVB4KjAuMyk7XHJcbiAgICAgICAgICAgIGxldCB4RWRnZTpudW1iZXIgPSAodHJpYW5nbGVFZGdlKjAuNSk7XHJcbiAgICAgICAgICAgIGxldCB5RWRnZTpudW1iZXIgPSBNYXRoLnNxcnQodHJpYW5nbGVFZGdlKnRyaWFuZ2xlRWRnZSAtIHhFZGdlKnhFZGdlKTsgLy8gYiA9IHNxcnQoY14yIC0gYV4yKVxyXG4gICAgICAgICAgICBsZXQgeFJhdGlvOm51bWJlciA9ICh4RWRnZS90cmlhbmdsZUVkZ2UpO1xyXG4gICAgICAgICAgICBsZXQgeVJhdGlvOm51bWJlciA9ICh5RWRnZS90cmlhbmdsZUVkZ2UpO1xyXG4gICAgICAgICAgICBsZXQgc2hhZG93UGl4Om51bWJlciA9ICgoc3F1YXJlU2l6ZVB4KlNIQURPV19QQ1QpKjAuNSk7XHJcbiAgICAgICAgICAgIGxldCBzaGFkb3dYOm51bWJlciA9IChzaGFkb3dQaXgqeFJhdGlvKTtcclxuICAgICAgICAgICAgbGV0IHNoYWRvd1k6bnVtYmVyID0gKHNoYWRvd1BpeCp5UmF0aW8pO1xyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZXJtaW5lIGlmIHRoaXMgaXMgYSBjeWNsZSBvciBhbiBleGl0XHJcbiAgICAgICAgICAgIGxldCB0cmlhbmdsZUNvbG9yOm51bWJlciA9IENPTE9SX0NZQ0xFO1xyXG4gICAgICAgICAgICBpZigtMSAhPSBleGl0cy5pbmRleE9mKChpKmdfbnVtU3F1YXJlcykgKyBqKSlcclxuICAgICAgICAgICAgICAgIHRyaWFuZ2xlQ29sb3IgPSBDT0xPUl9FWElUO1xyXG5cclxuICAgICAgICAgICAgLy8gRHJhdyBiYWNrZ3JvdW5kIHRyaWFuZ2xlXHJcbiAgICAgICAgICAgIGNyZWF0ZVRyaWFuZ2xlKFxyXG4gICAgICAgICAgICAgICAgLXhFZGdlLCAteEVkZ2UsIC8vIGxlZnRcclxuICAgICAgICAgICAgICAgIDAsICgteUVkZ2UteEVkZ2UpLCAvLyB0b3BcclxuICAgICAgICAgICAgICAgIHhFZGdlLCAteEVkZ2UsIC8vIHJpZ2h0XHJcbiAgICAgICAgICAgICAgICB0cmlhbmdsZUNvbG9yLCAxLjAsIG5ld0Fycm93KTtcclxuXHJcbiAgICAgICAgICAgIC8vIERyYXcgc2hhZG93IG92ZXIgZW50aXJlIHRyaWFuZ2xlXHJcbiAgICAgICAgICAgIGNyZWF0ZVRyaWFuZ2xlKFxyXG4gICAgICAgICAgICAgICAgLXhFZGdlLCAteEVkZ2UsIC8vIGxlZnRcclxuICAgICAgICAgICAgICAgIDAsICgteUVkZ2UteEVkZ2UpLCAvLyB0b3BcclxuICAgICAgICAgICAgICAgIHhFZGdlLCAteEVkZ2UsIC8vIHJpZ2h0XHJcbiAgICAgICAgICAgICAgICBDT0xPUl9TSERXLCBTSEFET1dfQVJST1dfQUxQSEEsIG5ld0Fycm93KTtcclxuXHJcbiAgICAgICAgICAgIC8vIERyYXcgdW5zaGFkZWQgdHJpYW5nbGUgb3ZlciBzaGFkb3dcclxuICAgICAgICAgICAgY3JlYXRlVHJpYW5nbGUoXHJcbiAgICAgICAgICAgICAgICAoLXhFZGdlK3NoYWRvd1kpLCAoLXNoYWRvd1gteEVkZ2UpLCAvLyBsZWZ0XHJcbiAgICAgICAgICAgICAgICAwLCAoLXlFZGdlK3NoYWRvd1kteEVkZ2UpLCAvLyB0b3BcclxuICAgICAgICAgICAgICAgICh4RWRnZS0oc2hhZG93WSkpLCAoLXNoYWRvd1gteEVkZ2UpLCAvLyByaWdodFxyXG4gICAgICAgICAgICAgICAgdHJpYW5nbGVDb2xvciwgMS4wLCBuZXdBcnJvdyk7XHJcblxyXG4gICAgICAgICAgICAvLyBSb3RhdGUgaW4gdGhlIGNvcnJlY3QgZGlyZWN0aW9uXHJcbiAgICAgICAgICAgIG5ld0Fycm93LnJvdGF0aW9uICs9IChIQUxGX1BJKihkaXJlY3Rpb25zW2ldW2pdLTEpKTsgLy8gUm90YXRlIHJpZ2h0LCBkb3duIG9yIGxlZnRcclxuXHJcbiAgICAgICAgICAgIGJvYXJkSW5uZXIuYWRkQ2hpbGQobmV3QXJyb3cpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXBDaGVja2VyKCkge1xyXG4gICAgLy8gTWFyayB3aGVyZSB0aGUgY2hlY2tlciBzdGFydHNcclxuICAgIGNyZWF0ZVNoYWRvd2VkVGV4dChcIlNUQVJUXCIsIDAsIDAsIFwiQXJpYWxcIiwgKHNxdWFyZVNpemVQeC84KSwgXCJPcmFuZ2VcIiwgXCJCbGFja1wiLCAxLjAsIDEsIDEsIHN0YXJ0TWFya2VyKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIGNoZWNrZXJcclxuICAgIGNyZWF0ZVNwcml0ZShVUkxfQ0hFQ0tFUiwgMCwgMCwgKHNxdWFyZVNpemVQeCowLjUpLCAoc3F1YXJlU2l6ZVB4KjAuNSksIHRydWUsIGNoZWNrZXIpO1xyXG5cclxuICAgIC8vIFBvc2l0aW9uIHRoZSBtYXJrZXIgYW5kIHRoZSBjaGVja2VyXHJcbiAgICByYW5kb21pemVDaGVja2VyUG9zKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJhbmRvbWl6ZUNoZWNrZXJQb3MoKSB7XHJcbiAgICBtb3ZpbmcgPSBmYWxzZTtcclxuICAgIHNldENoZWNrZXJQb3MocmFuZG9tSW50KDAsIGdfbnVtU3F1YXJlcy0xKSwgcmFuZG9tSW50KDAsIGdfbnVtU3F1YXJlcy0xKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldENoZWNrZXJQb3Mocm93LCBjb2wpIHtcclxuICAgIGN1cnJSb3cgPSByb3c7XHJcbiAgICBjdXJyQ29sID0gY29sO1xyXG5cclxuICAgIC8vIENhbGN1bGF0ZSB0aGUgZ2xvYmFsIHBvc2l0aW9uIG9mIHRoZSBuZXcgcm93IGFuZCBjb2x1bW5cclxuICAgIGxldCBjaGVja2VyWFBvczpudW1iZXIgPSBib2FyZElubmVyLmdldEdsb2JhbFBvc2l0aW9uKCkueCArIChzcXVhcmVTaXplUHgqY3VyckNvbCkgKyAoc3F1YXJlU2l6ZVB4KjAuNSk7XHJcbiAgICBsZXQgY2hlY2tlcllQb3M6bnVtYmVyID0gYm9hcmRJbm5lci5nZXRHbG9iYWxQb3NpdGlvbigpLnkgKyAoc3F1YXJlU2l6ZVB4KmN1cnJSb3cpICsgKHNxdWFyZVNpemVQeCowLjUpO1xyXG5cclxuICAgIC8vIFBvc2l0aW9uIHRoZSBzdGFydCBtYXJrZXIgb3ZlciB0aGUgbmV3IGJvYXJkIHBvc2l0aW9uXHJcbiAgICBzdGFydE1hcmtlci5wb3NpdGlvbi54ID0gY2hlY2tlclhQb3M7XHJcbiAgICBzdGFydE1hcmtlci5wb3NpdGlvbi55ID0gY2hlY2tlcllQb3M7XHJcblxyXG4gICAgLy8gUG9zaXRpb24gdGhlIGNoZWNrZXIgb3ZlciB0aGUgbmV3IGJvYXJkIHBvc2l0aW9uXHJcbiAgICBjaGVja2VyLnBvc2l0aW9uLnggPSBjaGVja2VyWFBvcztcclxuICAgIGNoZWNrZXIucG9zaXRpb24ueSA9IGNoZWNrZXJZUG9zO1xyXG5cclxuICAgIHR1cm5DaGVja2VyKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW5Mb29wKCkge1xyXG4gICAgLy8gU3RhcnQgdGhlIHRpbWVyIGZvciB0aGUgbmV4dCBhbmltYXRpb24gbG9vcFxyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1haW5Mb29wKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgZm9yIHRoZSBjdXJyZW50IHN0YXRlXHJcbiAgICBzdGF0ZSgpO1xyXG5cclxuICAgIC8vIFJlbmRlciB0aGUgc2NlbmVcclxuICAgIHJlbmRlcmVyLnJlbmRlcihzdGFnZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBsYXkoKSB7XHJcbiAgICB1cGRhdGVDaGVja2VyKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhdXNlKCkge1xyXG59XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVDaGVja2VyKCkge1xyXG4gICAgLy8gSWYgbm90IG1vdmluZywgdGhlbiBjaGFuZ2UgZGlyZWN0aW9uIGFuZCBnZXQgdGhlIGRlc2lyZWQgZGVzdGluYXRpb25cclxuICAgIGlmKCFtb3ZpbmcpIHtcclxuICAgICAgICAvLyBJZiB3ZSd2ZSBnb25lIG9mZiB0aGUgZ3JpZCwgc2V0IHN0YXRlIHRvIHBhdXNlLCBhbmQgZG9uJ3QgdHJ5IHRvIG1vdmVcclxuICAgICAgICBpZihjdXJyQ29sIDwgMCB8fCBjdXJyQ29sID49IGdfbnVtU3F1YXJlcyB8fFxyXG4gICAgICAgICAgICBjdXJyUm93IDwgMCB8fCBjdXJyUm93ID49IGdfbnVtU3F1YXJlcykge1xyXG4gICAgICAgICAgICAgIHN0YXRlID0gcGF1c2U7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0dXJuQ2hlY2tlcigpO1xyXG4gICAgICAgIG5leHRTcXVhcmUoKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIG1vdmVTdGVwKDEpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0dXJuQ2hlY2tlcigpIHtcclxuICAgIC8vIEdldCBhIHJlbGF0aXZlIHR1cm5cclxuICAgIGN1cnJEaXIgPSBkaXJlY3Rpb25zW2N1cnJSb3ddW2N1cnJDb2xdO1xyXG4gICAgbGV0IHR1cm46bnVtYmVyID0gKChjdXJyRGlyIC0gcHJldkRpcikgKyA0KSAlIDQ7IC8vIDAgLSAzXHJcbiAgICBpZih0dXJuID4gMilcclxuICAgICAgdHVybiAtPSA0O1xyXG4gICAgY2hlY2tlci5yb3RhdGlvbiArPSAoSEFMRl9QSSp0dXJuKTtcclxuICAgIHByZXZEaXIgPSBjdXJyRGlyO1xyXG59XHJcblxyXG5mdW5jdGlvbiBuZXh0U3F1YXJlKCkge1xyXG4gICAgbGV0IHg6bnVtYmVyID0gY2hlY2tlci5wb3NpdGlvbi54O1xyXG4gICAgbGV0IHk6bnVtYmVyID0gY2hlY2tlci5wb3NpdGlvbi55O1xyXG5cclxuICAgIHN3aXRjaCAoY3VyckRpcikge1xyXG4gICAgY2FzZSAxOiAvLyBVcFxyXG4gICAgICAgIGN1cnJSb3ctLTtcclxuICAgICAgICBzZXREZXN0aW5hdGlvbih4LCB5IC0gc3F1YXJlU2l6ZVB4KTtcclxuICAgICAgICBicmVhaztcclxuICAgIGNhc2UgMjogLy8gUmlnaHRcclxuICAgICAgICBjdXJyQ29sKys7XHJcbiAgICAgICAgc2V0RGVzdGluYXRpb24oeCArIHNxdWFyZVNpemVQeCwgeSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDM6IC8vIERvd25cclxuICAgICAgICBjdXJyUm93Kys7XHJcbiAgICAgICAgc2V0RGVzdGluYXRpb24oeCwgeSArIHNxdWFyZVNpemVQeCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDQ6IC8vIExlZnRcclxuICAgICAgICBjdXJyQ29sLS07XHJcbiAgICAgICAgc2V0RGVzdGluYXRpb24oeCAtIHNxdWFyZVNpemVQeCwgeSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldERlc3RpbmF0aW9uKHgsIHkpIHtcclxuICAgIG1vdmluZyA9IHRydWU7XHJcbiAgICBkZXN0WCA9IHg7XHJcbiAgICBkZXN0WSA9IHk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdmVTdGVwKHNwZWVkKSB7XHJcbiAgICBzd2l0Y2ggKGN1cnJEaXIpIHtcclxuICAgIGNhc2UgMTogLy8gVXBcclxuICAgICAgICBtb3ZlVXAoc3BlZWQpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgY2FzZSAyOiAvLyBSaWdodFxyXG4gICAgICAgIG1vdmVSaWdodChzcGVlZCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDM6IC8vIERvd25cclxuICAgICAgICBtb3ZlRG93bihzcGVlZCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICBjYXNlIDQ6IC8vIExlZnRcclxuICAgICAgICBtb3ZlTGVmdChzcGVlZCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICBpZihjaGVja2VyLnBvc2l0aW9uLnggPT0gZGVzdFggJiYgY2hlY2tlci5wb3NpdGlvbi55ID09IGRlc3RZKSB7XHJcbiAgICAgICAgbW92aW5nID0gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdmVMZWZ0KHBpeCkge1xyXG4gICAgcGl4ID0gTWF0aC5taW4ocGl4LCBNYXRoLmFicyhkZXN0WCAtIGNoZWNrZXIucG9zaXRpb24ueCkpO1xyXG4gICAgbW92ZVgoLXBpeCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdmVSaWdodChwaXgpIHtcclxuICAgIHBpeCA9IE1hdGgubWluKHBpeCwgTWF0aC5hYnMoZGVzdFggLSBjaGVja2VyLnBvc2l0aW9uLngpKTtcclxuICAgIG1vdmVYKHBpeCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdmVVcChwaXgpIHtcclxuICAgIHBpeCA9IE1hdGgubWluKHBpeCwgTWF0aC5hYnMoZGVzdFkgLSBjaGVja2VyLnBvc2l0aW9uLnkpKTtcclxuICAgIG1vdmVZKC1waXgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb3ZlRG93bihwaXgpIHtcclxuICAgIHBpeCA9IE1hdGgubWluKHBpeCwgTWF0aC5hYnMoZGVzdFkgLSBjaGVja2VyLnBvc2l0aW9uLnkpKTtcclxuICAgIG1vdmVZKHBpeCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vdmVYKHBpeCkge1xyXG4gICAgY2hlY2tlci5wb3NpdGlvbi54ICs9IHBpeDtcclxufVxyXG5cclxuZnVuY3Rpb24gbW92ZVkocGl4KSB7XHJcbiAgICBjaGVja2VyLnBvc2l0aW9uLnkgKz0gcGl4O1xyXG59XHJcblxyXG4vLyBHZXQgYSByYW5kb20gaW50ZWdlciBiZXR3ZWVuIG1pbiBhbmQgbWF4IChpbmN1c2l2ZSlcclxuZnVuY3Rpb24gcmFuZG9tSW50KG1pbiwgbWF4KSB7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcclxufVxyXG4iXX0=
