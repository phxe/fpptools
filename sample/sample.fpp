# Test code:

# Diagnostic Error Example
# type F32
# type default

# Valid
type A
type \ ###
B

# Error
# type A
# type ###
# C

# Valid
array C = [3 + 4] U8
array D = [3 + -1] A
array E = [3] F32 default [ 1, 2, 3 ]
array F = [3] U32 default 5 * 5 + ###
5 \
/ 5
array G = [3] U32 default 1 format "{.03f}"

# Error
# array H = [3] X
# array C = [3] U32 default 1
# array I = U32 default 1
# array J = [5] F32 default [ 1, 2, 3 ]
# array K = [3] U32 default 1 format {.03f}

# Valid
active component L {
enum M {
  N
  O
}
  async input port T: M.N priority 10 drop
  sync input port U: 
    serial
  guarded input port V: [5 * 5] serial
  output port W: [10] M.O
  event port X
  text event port Y
  time get port Z
  param set port AA
  command recv port AB
  async command AsyncParams(
    param1: U32 @< Param 1
    param2: string size 4 @< Param 2
  ) opcode 0x03
}

# Error
# active component L {
#   input port AC: 5 priority 10 drop
#   sync input
#   port AD: serial
#   recv port AE
#   event port AF # Valid
#   event port AF
# }

constant AC = 6

module Svc {
  active component CommandDispatcher {
  }
}

instance commandDispatcher: Svc.CommandDispatcher base id 0x100 \
  queue size 10 
  stack size 4096 priority 30 \
{
  phase AC """
  commandDispatcher.init(QueueDepth::commandDispatcher);
  """
}


enum AD { AE = 0, AF = 1 }

constant XXX = "A"

constant XXX = """
// Test
"""


enum FilterSeverity {
  WARNING_HI = 0 @< Filter WARNING_HI events
  WARNING_LO = 1 @< Filter WARNING_LO events
  COMMAND = 2 @< Filter COMMAND events
  ACTIVITY_HI = 3 @< Filter ACTIVITY_HI events
  ACTIVITY_LO = 4 @< Filter ACTIVITY_LO events
  DIAGNOSTIC = 5 @< Filter DIAGNOSTIC events
}

struct PacketStat {
  BuffRecv: U32 @< Number of buffers received
  BuffErr: U32 @< Number of buffers received with errors
  PacketStatus: PacketRecvStatus @< Packet Status
}

struct SignalInfo {
  $type: Ref.SignalType
  history: Ref.SignalSet
  pairHistory: Ref.SignalPairSet
}

struct SignalPair {
  $time: F32 format "{f}"
  value: F32 format "{f}"
}


# module RealModule {
#   constant realIdentifier = 10 * 0.0123456789 * 0xABCDEFabcdef0123456789
# }


# module M {
#   constant a = 0
#   enum E {
#     b = 2
#     c = b # Refers to M.E.b
#     d = E.b # Refers to M.E.b
#     e = M.E.b # Refers to M.E.b
#   }
#   constant f = a # Refers to M.a
#   constant g = M.a # Refers to M.a
#   constant h = E.b # Refers to M.E.b
#   constant i = M.E.b # Refers to M.E.b
# }

module Drv {

  port GpioWrite(
                  state: bool
                )

  type ComBuffer

  @ Port for passing communication packet buffers
  port Com(
            ref data: ComBuffer @< Buffer containing packet data
            context: U32 @< Call context value; meaning chosen by user
          )

}

module Drv {

  port GpioRead(
                 ref state: bool
               )

}


command connections instance commandDispatcher {
  Drv.GpioRead,
  Drv.GpioWrite,
}


# Syntax Tests
# 43423
# 52525*5325
# 003
# 0*4/0+3/0.0e+42
# 0x44334

# 3.1415
# 2.51e-21
# 2.4e34
# 3.5e+415
# 32e-15
# 321e+15
# 3e+5*3.515

# asdf3.a
# a.a
# (6).5
# ADS.
# 5.
# 5.6

# (3.1415)
# [2.51e-21]
# 2.4e34*
# 3.5e+415/
# 32e-15+
# {321e+15}
# 3e+5-5