Installing express mongoose nodemon dotenv bcrypt
npm install express-validator cookie-parser cors

1.creating server + connect to db
2.routing + import the contorllers in router
3.build controller + middleware + validation


/registerUser 
1.get user all data = req.body
2.check user alredy exist or not
3.hash pass => bcryptjs
4.create new user
5.create jwt token
6.pass token in cookies
7.send response = "USER CREATED"


/loginuser 
1.get user  from req.body
2.validate user emial
3.hash pasword + validate
4.isPassvalidate =>create token 
5.send he token in cookie


/auth-middleware
get the token 
validate token
verify token with jwt secret  via userid
get the user form model +validate
put req.user = user
next()



TOKEN (2types)
= blacklisting token using the rabbitmq
= create database on redis io => launch instance => add  secrets(port ,host ,passowrd)




























