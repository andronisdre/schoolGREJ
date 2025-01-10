1: You can remove customer Id from order creation, and the order still gets created. (SOLVED) 
2: Errors aren't logging? Error handling does not tell the user what went wrong. Does not give the user a informative error message 
3: We can currently set status to an empty string. There is no error handling checking if the status is valid (pending, processing etc). We can also change the ID of the order.
4: 
5: 
6
7
8
9
10: sending, and canceling a process returns the message "Already processing". Shouldn't "cancel" in postman allow us to re-post the process right away?
