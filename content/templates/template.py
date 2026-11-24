import sys


def main():
    data = sys.stdin.buffer.read().split()
    it = iter(data)

    n = int(next(it))
    a = [int(next(it)) for _ in range(n)]

    # solution


main()
