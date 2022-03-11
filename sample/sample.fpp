# Code Snippets:

type A

type 
B

module RealModule {
  constant realIdentifier = 10 * 0.0123456789 * 0xABCDEFabcdef0123456789
}

instance blockDrv: Drv.BlockDriver base id 0x0100 \
  queue size RealModule.realIdentifier \
  stack size FakeModule.fakeIdentifier \
  priority 140 \
{
  phase Fpp.ToCpp.Phases.instances """
  // Declared in RefTopologyDefs.cpp
  """
}

   """\"\"\""""
   """ ABC
   ABC """


enum AnEnum {
  ENUM_MEMBER
}

AnEnum.ENUM_MEMBER
NotAnEnum.ENUM_MEMBER

# Operators:
)
]
}
(
*
+
,
-
->
.
/
:
;
=
[
{

# Symbols:
\
#
@
@<

# Types:
F32
F64
I16
I32
I64
I8
U16
U32
U64
U8
array
bool
enum
string
struct
type
constant

# Keywords:
active
activity
always
assert
async
at
base
block
change
command
component
connections
cpu
default
diagnostic
drop
event
false
fatal
format
get
guarded
health
high
id
import
include
input
instance
internal
locate
low
match
module
on
opcode
orange
output
param
passive
phase
port
priority
private
queue
queued
recv
red
ref
reg
resp
save
serial
set
severity
size
stack
sync
telemetry
text
throttle
time
topology
true
update
warning
with
yellow