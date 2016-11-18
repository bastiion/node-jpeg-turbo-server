# node-jpeg-turbo-server
lightweight thumbnail express-server using jpeg-turbo for thumbnail generation


## API

### GET /scalefactors

retreive a list of possible scale factors

### GET /turbo/[PATH_TO_IMAGE]

Parameter:
 * scale: Scalefactor used for thumbnail (default 1)
 * quality: jpeg compression quality level (default 100)


