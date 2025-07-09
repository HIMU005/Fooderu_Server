function error(msg = "Someting went worng", status = 500) {
  const err = new Error(msg);

  return err;
}

module.exports = error;
