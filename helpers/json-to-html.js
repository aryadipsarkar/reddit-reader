module.exports = function(text) {
    if(text !== null) {
        text = text.replace(/(&lt;)/gm, "<"); // Remove new lines and tabs
        text = text.replace(/(&gt;)/gm, ">"); // Escape any backslashes
    }
    return text;
};
