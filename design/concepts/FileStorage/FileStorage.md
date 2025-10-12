# concept 
- **purpose** stores files that the user would like the generator to have as context while generating an answer to their question, such as writing style, skills, etc

- **principle** after a user uploads files, the output of the generator will utilize the information from the resume while answering the question/prompt, the user can also choose to remove files, and the generator will no longer use the information from that file

- state
	- a set of `Files` with
		- a name of type `String`
		- a content of type `String`

- actions
	- upload(name: String, content: String): (File)
		- requires: name does not already exist in Files
		- effect: add new File to Files with name and content
	- remove(name: String): (File)
		- requires: name does exist in Files
		- effect: remove file with name from Files
	- rename(name: String, newName: String): (File)
		- requires: name does exist in Files, newName does not exist in Files
		- effect: replaces name with newName
	- files(): (Files)
		- effect: return all Files



