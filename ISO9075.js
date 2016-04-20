/**
 * Created by tuanzhang on 20/4/2016.
 */

function decode(toDecode)
{
    if ((toDecode == null) || (toDecode.length < 7) || (toDecode.indexOf("_x") < 0))
    {
        return toDecode;
    }
    var decoded = [];
    for (var i = 0, l = toDecode.length; i < l; i++)
    {
        if (matchesEncodedPattern(toDecode, i))
        {
            var int = parseInt(toDecode.substring(i + 2, i + 6), 16);
            var char=String.fromCharCode(int);
            decoded.push(char);
            i += 6;// then one added for the loop to mkae the length of 7
        }
        else
        {
            decoded.push(toDecode.charAt(i));
        }
    }
    return decoded.join("");
}

function matchesEncodedPattern(string, position)
{
    return (string.length > position + 6)
        && (string.charAt(position) == '_') && (string.charAt(position + 1) == 'x')
        && isHexChar(string.charAt(position + 2)) && isHexChar(string.charAt(position + 3))
        && isHexChar(string.charAt(position + 4)) && isHexChar(string.charAt(position + 5))
        && (string.charAt(position + 6) == '_');
}
function isHexChar(c)
{
    switch (c)
    {
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case 'a':
        case 'b':
        case 'c':
        case 'd':
        case 'e':
        case 'f':
        case 'A':
        case 'B':
        case 'C':
        case 'D':
        case 'E':
        case 'F':
            return true;
        default:
            return false;
    }
}
exports.decode = decode;