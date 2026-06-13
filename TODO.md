3. Why labels popup closes automatically when selecting the label. The handler is never called.

   - Unknown, sometimes it doesn't close automatically for some reason, perhaps it depend on if the data is loaded, maybe some github handler etc
     Yet sometimes it closes automatically, perhaps it depends on the order of the code execution
     So we still need to handle the closing just in case
   - Tested in real env
     - when you open PR for the first time, the labels doesn't close automatically
     - when you try to fill once again - the popup closes automatically

4. Change labels parameter to "values"

## Ideas

1. Toggle description, reviewers and labels to enable autofill
   Some used would prefer to keep the original description

2. Add configuration for labels
   E.g enable setting labels array to assign them for the PR, we use UI labels for ui projects but for backend pr we should not include this label

3. Add label for backend PRs?
