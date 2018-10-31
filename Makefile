pretest:
	@node ./node_modules/.bin/tslint -p ./tsconfig.json "./src/**/*.ts" "./test/**/*.ts"
test:
	@node node_modules/.bin/jest
coveralls:
	cat ./coverage/lcov.info | node ./node_modules/.bin/coveralls
tsc:
	@node ./node_modules/.bin/tsc -p ./tsconfig.build.json
ngc-tokens:
	@node ./node_modules/.bin/ngc -p ./tsconfig.build.tokens.json
clean:
	@node ./node_modules/.bin/rimraf ./dist
packaging:
	@node ./node_modules/.bin/ts-node ./tools/packaging.ts

.PHONY: pretest test coveralls tsc ngc-tokens clean packaging