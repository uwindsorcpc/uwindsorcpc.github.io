import sys


def main():
    # ---- Fast input ---------------------------------------------------------
    # input() is slow for large inputs. Reading everything at once and
    # splitting on whitespace is much faster, and it doesn't matter how the
    # input is split across lines.
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    a = list(map(int, data[1:1 + n]))

    # Need to read line by line instead? Use this (it keeps the trailing '\n'):
    #   line = sys.stdin.readline()

    # ---- Solve --------------------------------------------------------------
    # Python manages roughly 10^7 simple operations per second, about 10x
    # slower than C++. Prefer built-ins (sum, sorted, min, max) over manual
    # loops: they run in C and are much faster.

    # ---- Write --------------------------------------------------------------
    # Many print() calls are slow. Collect the output, then write it once.
    sys.stdout.write(" ".join(map(str, a)) + "\n")


# Code inside a function runs faster than code at the top level,
# because local variables are quicker to look up than globals.
if __name__ == "__main__":
    main()
