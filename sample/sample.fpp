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
  }
  enum O: U32 {
    P
    Q
    R
  } default R
 guarded input port S: M.N
 command recv port T
 event port U
 text event port V
 time get port W
#  async command H \
#    opcode 0
#  event I(
#          Id: U32 @< The parameter ID
#         ) \
#    severity warning low \
#    id 0 \
#    format "Parameter ID 0x{x} not found" \
#    throttle 5
}

# module RealModule {
#   constant realIdentifier = 10 * 0.0123456789 * 0xABCDEFabcdef0123456789
# }
# 
# instance blockDrv: Drv.BlockDriver base id 0x0100 \
#   queue size RealModule.realIdentifier \
#   priority 140 \
# {
#   phase Fpp.ToCpp.Phases.instances """
#   // Declared in RefTopologyDefs.cpp
#   """
# }

