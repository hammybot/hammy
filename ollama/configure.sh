#!/usr/bin/env sh

##todo: we should move this into the code on startup with ollama sdk

#create model
ollama create hammy --file ${MODEL_DIR}/hammy.modelfile
