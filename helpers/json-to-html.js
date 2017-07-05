module.exports = function(text) {
    if(text !== null) {
        text = text.replace(/(&lt;)/gm, "<");
        text = text.replace(/(&gt;)/gm, ">");
    }
    return text;
};
