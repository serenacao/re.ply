# concept 
- **purpose** stores files that the user would like the generator to have as context while generating an answer to their question, such as writing style, skills, etc

- **principle** after a user uploads files, the output of the generator will utilize the information from the resume while answering the question/prompt, the user can also choose to remove files, and the generator will no longer use the information from that file

- state
	- a set of `Files` with
		- a name of type `String`
		- a content of type `String`
		- a User

- actions
	- upload(user: User, name: String, content: String): (File)
		- requires: user exists, name does not already exist in user's Files
		- effect: add new File to user's Files with name and content
	- remove(user: User, name: String): (File)
		- requires: user exists, name does exist in user's Files
		- effect: remove file with name from user's Files
	- rename(name: String, newName: String): (File)
		- requires: user exists, name does exist in user's Files, newName does not exist in user's Files
		- effect: replaces name with newName in user's Files 
	- files(user: User): (Files)
		- requires: user exists 
		- effect: return all Files under User



