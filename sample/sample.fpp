# Test code:

# Diagnostic Error Example
# type F32
# type default

# Valid
type A
type \
B

# Error
# type A
# type 
# C

# Valid 
array C = [3] U8
array D = [3] A
array E = [3] F32 default [ 1, 2, 3 ]
array F = [3] U32 default 1
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
  guarded input port V: 5 * 5
  output port W: [10] M.O
  event port X
  text event port Y
  time get port Z
  param set AA
  command recv port AB
}

# Error
# active component L {
#   input port M: 5 priority 10 drop
#   sync input
#   port N: serial
#   recv port O
#   event port O # Valid
#   event port O
# }

constant AC = 6

instance commandDispatcher: Svc.CommandDispatcher \
  base id 0x100 \
  queue size 10 \
  stack size 4096 \
  priority 30 \
{
  phase AC """
  commandDispatcher.init(QueueDepth::commandDispatcher);
  """
}

# enum FilterSeverity {
#   WARNING_HI = 0 @< Filter WARNING_HI events
#   WARNING_LO = 1 @< Filter WARNING_LO events
#   COMMAND = 2 @< Filter COMMAND events
#   ACTIVITY_HI = 3 @< Filter ACTIVITY_HI events
#   ACTIVITY_LO = 4 @< Filter ACTIVITY_LO events
#   DIAGNOSTIC = 5 @< Filter DIAGNOSTIC events
# }

# struct PacketStat {
#   BuffRecv: U32 @< Number of buffers received
#   BuffErr: U32 @< Number of buffers received with errors
#   PacketStatus: PacketRecvStatus @< Packet Status
# }


# module RealModule {
#   constant realIdentifier = 10 * 0.0123456789 * 0xABCDEFabcdef0123456789
# }

