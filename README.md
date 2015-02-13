# Fetcher
*A downloader, updater and launcher for games and other applications.*

## Build your own distribution for your payload

Create a file named fetcher.json to store your application specific options (you can use src/fetcher.json.example as a base for this):

ui.resizable: boolean to control whether the window can be resized.
app.executable: relative path to the binary file that should be called to run your application after the update
httpupdater.baseurl: URL to the resource that holds the files for your application