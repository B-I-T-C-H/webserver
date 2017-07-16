# webserver

To use, git clone this repository and cd into the folder, and type:
```
npm install
```
You will need to set up information in the `.env` file, which is included in our Dropbox folder. Make sure to add your own Reddit username and password.

After you fill in information on the `.env` file, copy and paste it into the newly cloned folder.

Also the `.env` file is a hidden file, so make sure you look for that.

To run, type:
```
node server.js
```
Although it's a better idea to use nodemon, so given that nodemon is already installed, type:

```
nodemon server.js
```
After that, you should be able to see the app from `localhost:8080`