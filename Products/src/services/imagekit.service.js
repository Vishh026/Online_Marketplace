const ImageKit = require('imagekit')
const { v4: uuidv4 } = require("uuid");

function getImageKit() {
    // when file uploads then only it starts otherwise can't
  return new ImageKit({
    publicKey: process.env.PUBLIC_KEY_IMAGEKIT,
    privateKey: process.env.PRIVATE_KEY_IMAGEKIT,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}

async function uploadImage({buffer,folder= '/products'}){
    const imageKit = getImageKit()

    const res = await imageKit.upload({
        file: buffer,
        fileName: uuidv4(), 
        folder 
    })
    return{
        url: res.url,
        thumbnail:res.thumbnailUrl || res.url, 
        id: res.fileId
    }
}

module.exports = {
   uploadImage
}