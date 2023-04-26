build: 
	docker build -t botgpt .

run:
	docker run -d -p 3001:3001 --name botgpt --rm botgpt