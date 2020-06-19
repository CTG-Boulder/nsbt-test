
# rw commands for the BG22 thunderboard BT gadget for ET using NIST protocol

## Commands to the rw characteristic are single characters

### Important / relevant bluetooth commands

* 'f':  Put BT gadget in the mode to transfer the flash memory over BT
* 'F':  Turn off OTA flash memory transfer
* 'I':  Get byte over bluetooth on the data characterstic that is 0 if not storing to flash,
   1 if storing counts to flash
* 'w':  Start storing encounters on to the flash
* 's':  Stop storing data to the flash
* 'A':  Retrieve bluetooth gadget time since boot in [ms], send over
   bluetooth, data is received over the data_uuid, 2 4-byte integers
   little-endian
* 'C':  Erase flash
* 'O':  transfer epoch time informatioin to the gadget via bluetooth using 3
   4-byte integers that are received over the data_uuid characteristic
* 'N':  Set name that appears on bluetooth scans... 8 letters, sent over
   data_uuid
* 'M':  Store special encounter event... Use for human subject testing
* 'U':  Store 2nd type of special encounter event... Use for human subject
   testing

### Commands not used/needed not sure they still work

* 'r':  output to serial port
* 'z':  stop output to serial port
* 'g':  fetch all data from flash memory over the serial port
* 'G':  Send a contents of a particular address in flash storage, need to get
   the address from the data characteristic
* 'h':  send version information to over serial port
* 'a':  Retrieve bluetooth gadget time since boot in milliseconds, send over
   serial port, two 4byte integers little-endian, first number is the least
   signifant digits, 2nd number is the number of overflows
* 'o':  transfer epoch time to gadget via USB serial port, 3 4byte integers
   are sent

​## UUIDs

service_uuid = 7b183224-9168-443e-a927-7aeea07e8105
count_uuid   = 292bd3d2-14ff-45ed-9343-55d125edb721
rw_uuid      = 56cd7757-5f47-4dcd-a787-07d648956068
data_uuid    = fec26ec4-6d71-4442-9f81-55bc21d658d6

## Description of steps to get data from the data_uuid characteristic

1. setup notify with data_uuid, need a "handler" that will be called to process data
2. write rw command that will then post data to data_uuid characteristic (e.g. 'I')
3. check to see if handler has received all the data
4. if got all the data, stop the notify process

## Description of protocol to get data from flash with the "f" and "F" commands

1. read the value from the count_uuid, this is the number of 32 byte chunks that have been written into the flash.
2. Compute the number of bytes that need to be transferred (32 * count)
3. setup notify handler
4. write "f" to rw_uuid to start the transfer using the data_uuid
5. write 0 to data_uuid using 4-byte little-endian integer, this will request the first packet of data from the bluetooth device
6. In the notify handler, the data from the bluetooth gadget needs to be processed.
    * Use the size of the first packet to indicate the size of all the packets that will come next
    * First 4 bytes will the the packet number that was requested
    * Check that the packet number is what we wanted, if not, throw away data, and request the packet nunber we want by writing the packet number to the data data_uuid as a 4 byte little endian integer
    * If it is the correct packet number, append the rest of the data in the packet to the collected data
    * increment packet number, and send the request via the data_uuid
7. Once all the data has been collected, send "F"
