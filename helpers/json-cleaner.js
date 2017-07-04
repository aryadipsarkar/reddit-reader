module.exports = function(text) {
    text = text.replace(/(\r\n|\n|\r|\t)/gm, " "); // Remove new lines and tabs
    text = text.replace(/(\")/gm, "\\\""); // Escape any backslashes
    return text;
};