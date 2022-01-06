# The Plan™️ for now, w/testing

1. Test that we can walk/get data from IPFS/UnixFS -> a JSON format of ours (recursively) on a known CAR
1. Upload all the files specified in dir using CAR format
1. Test that the uploaded JSON is sane.
1. Upload all files in a directory (with filter)
1. Generate local JSON format for the dir structure after files upload
1. Check if the locally-generated dir structure == the CAR
1. Upload the dir structure (UnixFS) to ipfs *after* files are uploaded
1. (non)-Profit?


## Demo any subtree of the above = an automatic CAR via ipfs