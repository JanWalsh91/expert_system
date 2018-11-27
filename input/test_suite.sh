#!/bin/bash

for filename in cor*.c
do
		fail=false
    node ../src/index.js $filename > tmp
		while read -r line; do
			res=`grep "$line" tmp`
			if [ -z "$res" ]
			then
				fail=true
				expectedLine=$line
				grepRes=`echo $line | cut -c1-1`
				outputLine=`grep "$grepRes: " tmp`
			fi
		done < "output_$filename"


		if $fail
		then
			printf "$filename: fail\n\tExcpected:\t[$expectedLine]\n\tHas\t\t[$outputLine]\n"
		else
			printf "$filename: OK\n"
		fi

		rm tmp 2>/dev/null
done
