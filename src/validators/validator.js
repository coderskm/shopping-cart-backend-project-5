const isValidBody = (value) => {
    return Object.keys(value).length > 0;
}

const isValid =  (value)=> {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  if (typeof value === "number") return false;
  return true;
};

const isValidPassword = (password) => {
    if (password.length > 7 && password.length < 16)
        return true;
}

const isValidFiles = (files) => {
  if (files && files.length > 0) {
    return true;
  }
}

 
module.exports = { isValidBody, isValid, isValidPassword, isValidFiles };
