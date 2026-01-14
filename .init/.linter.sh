#!/bin/bash
cd /home/kavia/workspace/code-generation/secure-notes-organizer-304744-304787/notes_app_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

