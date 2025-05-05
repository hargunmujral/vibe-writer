## Story Memory

### Overall idea

- contained in the context of a single project
- isolated to logical chunks of the story

### Memories generation

- minimum and maximum character length: 1k-5k chars.
  - Every 1k chars, the agent evaluates the story so far and decides if it is enough context to be added to memory.
    - Decider that is prompted to return yes or no
    - If decider returns yes, or maximum lenght is reached, then go to the summarizer step that will create a ~100 char memory chunk.
    - If decider returns no, then continue and don't generate a memory.
  - Users can edit chunks

### Story Characteristics Updating

- Every 5k chars, the following topics are revised and/or updated:
  - Character, Plot points, theme, setting, tone
  - We have a summary for each of these topics so far (first generated at the 5k characters point)
  - Users can update these
  - A decider is prompted to return yes or no for whether the context of each topic should change
  - Each response has a size limit (~200 characters?)
  - It's supposed to be an aggregate of the story so far.
  - Users can edit the different charactersitics, and choose to disable updates for each of them (ie if they want to stick to a particular characteristic summary.)

### Handling if the user goes back to edit

- Consider instead of each memory and story characteristic update, we just track the diff size between the last update. That way, memories are not only additive (if you delete or change part of the story, that will also be reflected in the memory).
- I anticipate this will be a pain point. consider if the user writes (which creates a new memory), and then deletes (which will also create a new memory). Then the user will have two conflicting memories.
- One possible solution is that, every time we update memory, we also consider all past memories, and see if any of them are no longer valid. If so, we delete or update them.
- This will be quite expensive in terms of LLM calls.

### First iteration

To keep things simple, this is how we will begin:

- One memory per 1k characters in the document. Makes it static and easy to manage
- upon editing, all the 1k chunks of text that are affected will be given a "dirty" flag.
- Batch it so that every X minutes, it will check for dirty chunks, and if there are any, it will run the summarizer on them.
- This means that memory will have a delay of up to X minutes in being updated. This should be okay.
- We can also do a "refresh memory" button that will force summarizing all dirty chunks.
- Also allow editing of memories.
