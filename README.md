## Installation
- Clone the repository
- Run `npm install`
- copy the `.env.example` file to `.env` and fill in the required values
- run `npm run dev` to start the server

## Cookie & CRSF Token
- open browser
- open developer tools
- go to linkedin web
- login to linkedin web (recomended to use new account)
- open network tab
- find the request with the name `GraphQL`
- copy the `cookie` and `csrf` value from request header
