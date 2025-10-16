# concept 
- **purpose:** limit access to known users

- **principle** after a user registers with a username and a password, they can authenticate with that same username and password and be treated each time as the same user

- **state**
	- a set of `Users` with
		- a username of type `String`
		- a password of type `String` 

- **actions**
	- register (username: String, password: String): (User)
		- requires: username does not exist already
		- effect: creates a new User with username and password
  
	- authenticate (username: String, password: String): (User)
		- requires: user with username and password to exist
		- effect: returns user