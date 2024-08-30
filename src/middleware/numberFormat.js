async function  formatNumber(number) {
    if (number === null) {
        number = 0; 
    }
    number = parseFloat(number)
    let hasDecimal = number % 1 !== 0;

    let formattedNumber = number.toLocaleString('en-IN', { maximumFractionDigits: 2 });

    if (!hasDecimal) {
        formattedNumber = formattedNumber.replace(/\.00$/, '');
    }

    return formattedNumber;
}


module.exports = {formatNumber}

