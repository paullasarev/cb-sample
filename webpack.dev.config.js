var path = require("path");
var webpack = require("webpack");

module.exports = {
    entry: "./app/js/app.js",
    output: {
      path: path.join(__dirname, "dev"),
      filename: "app.js",
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" }
        ]
    }
};