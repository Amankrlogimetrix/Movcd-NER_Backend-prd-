const isValidNo = function (number) {
    const validnumber = /^[6789]\d{9}$/
    return validnumber.test(number);
  };

  const isValidImage = function (name) {
    const linkRegex =/(.pdf|.png|.jpg|.jpeg)$/i;
    // const linkRegex = /\.(pdf|png|jpg|jpeg)$/i;
    return linkRegex.test(name);
  };
module.exports = {isValidNo,isValidImage}