'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    frame: false,
    height: 120,
    resizable: false,
    width: 400
  });

  //mainWindow.webContents.openDevTools();

  mainWindow.loadURL('file://' + __dirname + '/index.html');
}

function setCacheDir() {
    var cache_dir = process.env.FETCHER_CACHE_DIR || path.dirname(app.getPath('exe')) + '/cache';
    app.setPath('userData', cache_dir);
}

setCacheDir();
app.on('ready', createWindow);
