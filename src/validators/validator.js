const isValidBody = (value) => {
    return Object.keys(value).length > 0;
}

module.exports = {isValidBody}