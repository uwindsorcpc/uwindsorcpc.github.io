import sys

def main():
    # Read all of the input at once: much faster than calling input() in a loop.
    data = sys.stdin.buffer.read().split()
    n = int(data[0])
    a = list(map(int, data[1:1 + n]))

    print(sum(a))

if __name__ == "__main__":
    main()
